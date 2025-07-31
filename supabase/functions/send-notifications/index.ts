import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'absence_alert' | 'birthday_reminder' | 'promotion_ready' | 'class_reminder'
  studentIds?: string[]
  parentIds?: string[]
  message: string
  channel: 'sms' | 'email'
  metadata?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: requestData, error: parseError } = await req.json()
      .then(data => ({ data, error: null }))
      .catch(error => ({ data: null, error }))

    if (parseError || !requestData) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const notification: NotificationRequest = requestData

    // Validate required fields
    if (!notification.type || !notification.message || !notification.channel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, message, channel' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get recipients based on studentIds or parentIds
    let recipients: Array<{ id: string, email?: string, phone?: string, name: string }> = []

    if (notification.studentIds?.length) {
      // Get student emergency contacts
      const { data: students, error: studentsError } = await supabaseClient
        .from('students')
        .select('id, first_name, last_name, email, phone, emergency_contact_phone')
        .in('id', notification.studentIds)

      if (studentsError) {
        throw new Error(`Failed to fetch students: ${studentsError.message}`)
      }

      recipients = students?.map(student => ({
        id: student.id,
        email: student.email,
        phone: student.phone || student.emergency_contact_phone,
        name: `${student.first_name} ${student.last_name}`
      })) || []
    }

    if (notification.parentIds?.length) {
      // Get parent contacts
      const { data: parents, error: parentsError } = await supabaseClient
        .from('parents')
        .select(`
          user_id,
          user:users(email, first_name, last_name)
        `)
        .in('user_id', notification.parentIds)

      if (parentsError) {
        throw new Error(`Failed to fetch parents: ${parentsError.message}`)
      }

      const parentRecipients = parents?.map(parent => ({
        id: parent.user_id,
        email: parent.user?.email,
        phone: null, // Parents don't have phone in our schema
        name: `${parent.user?.first_name} ${parent.user?.last_name}`
      })) || []

      recipients = [...recipients, ...parentRecipients]
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recipients found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = []

    // Send notifications
    for (const recipient of recipients) {
      try {
        let success = false
        let errorMessage = null

        if (notification.channel === 'email' && recipient.email) {
          success = await sendEmail(recipient.email, recipient.name, notification.message, notification.type)
        } else if (notification.channel === 'sms' && recipient.phone) {
          success = await sendSMS(recipient.phone, notification.message)
        } else {
          errorMessage = `No ${notification.channel} contact available for ${recipient.name}`
        }

        // Log notification attempt
        const { error: logError } = await supabaseClient
          .from('notifications')
          .insert([{
            student_id: notification.studentIds?.includes(recipient.id) ? recipient.id : null,
            template: notification.type,
            channel: notification.channel,
            payload: {
              message: notification.message,
              recipient: recipient.name,
              contact: notification.channel === 'email' ? recipient.email : recipient.phone,
              metadata: notification.metadata
            },
            sent_at: success ? new Date().toISOString() : null,
            status: success ? 'sent' : (errorMessage || 'failed')
          }])

        if (logError) {
          console.error('Failed to log notification:', logError)
        }

        results.push({
          recipient: recipient.name,
          contact: notification.channel === 'email' ? recipient.email : recipient.phone,
          success,
          error: errorMessage
        })

      } catch (error) {
        console.error(`Failed to send notification to ${recipient.name}:`, error)
        results.push({
          recipient: recipient.name,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return new Response(
      JSON.stringify({
        success: true,
        totalRecipients: recipients.length,
        successCount,
        failureCount,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Notification function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendEmail(
  email: string, 
  name: string, 
  message: string, 
  type: string
): Promise<boolean> {
  const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
  
  if (!sendGridApiKey) {
    console.warn('SendGrid API key not configured')
    return false
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email, name }]
        }],
        from: {
          email: 'notifications@pmma.com', // Configure this
          name: 'PMMA Dojo'
        },
        subject: getEmailSubject(type),
        content: [{
          type: 'text/html',
          value: getEmailTemplate(name, message, type)
        }]
      })
    })

    return response.ok
  } catch (error) {
    console.error('SendGrid error:', error)
    return false
  }
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.warn('Twilio credentials not configured')
    return false
  }

  try {
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioPhoneNumber,
          Body: `PMMA Dojo: ${message}`
        })
      }
    )

    return response.ok
  } catch (error) {
    console.error('Twilio error:', error)
    return false
  }
}

function getEmailSubject(type: string): string {
  const subjects = {
    'absence_alert': 'We Miss You at PMMA!',
    'birthday_reminder': 'Happy Birthday from PMMA!',
    'promotion_ready': 'Belt Promotion Opportunity',
    'class_reminder': 'Class Reminder - PMMA'
  }
  return subjects[type] || 'PMMA Notification'
}

function getEmailTemplate(name: string, message: string, type: string): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #000000; padding: 20px; text-align: center;">
          <h1 style="color: #FFD700; margin: 0;">PMMA Dojo</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #000000;">Hello ${name},</h2>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ${message}
          </div>
          
          <p style="color: #666;">
            Thank you for being part of the PMMA family!
          </p>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This message was sent by PMMA Attendance Tracker</p>
            <p>If you have questions, please contact the dojo directly.</p>
          </div>
        </div>
      </body>
    </html>
  `
}