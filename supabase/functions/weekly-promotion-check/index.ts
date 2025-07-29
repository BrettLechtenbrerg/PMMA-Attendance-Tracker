import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get promotion candidates (students with ≥2 classes/week for last 8 weeks)
    const { data: candidates, error: candidatesError } = await supabaseClient
      .rpc('fn_promotion_candidates', {
        weeks_back: 8,
        min_classes_per_week: 2
      })

    if (candidatesError) {
      throw new Error(`Failed to fetch promotion candidates: ${candidatesError.message}`)
    }

    if (!candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No promotion candidates found',
          candidatesCount: 0 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get owners and managers to notify
    const { data: staffToNotify, error: staffError } = await supabaseClient
      .from('users')
      .select('id, email, first_name, last_name')
      .in('role', ['owner', 'manager'])

    if (staffError) {
      throw new Error(`Failed to fetch staff: ${staffError.message}`)
    }

    // Prepare promotion report
    const promotionReport = `
      <h3>Weekly Belt Promotion Candidates Report</h3>
      <p>The following students are ready for belt promotion based on their attendance:</p>
      
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Student Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Current Belt</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Avg Classes/Week</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total Classes (8 weeks)</th>
          </tr>
        </thead>
        <tbody>
          ${candidates.map(candidate => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${candidate.student_name}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${candidate.current_belt}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${candidate.avg_classes_per_week}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${candidate.total_classes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p><strong>Total Candidates: ${candidates.length}</strong></p>
      
      <p>Please review these students for belt promotion eligibility.</p>
    `

    // Send notifications to staff
    const results = []
    
    for (const staff of staffToNotify || []) {
      try {
        // Call the send-notifications function
        const notificationResponse = await supabaseClient.functions.invoke('send-notifications', {
          body: {
            type: 'promotion_ready',
            parentIds: [staff.id],
            message: promotionReport,
            channel: 'email',
            metadata: {
              candidatesCount: candidates.length,
              reportDate: new Date().toISOString()
            }
          }
        })

        if (notificationResponse.error) {
          throw new Error(notificationResponse.error.message)
        }

        results.push({
          recipient: `${staff.first_name} ${staff.last_name}`,
          email: staff.email,
          success: true
        })

      } catch (error) {
        console.error(`Failed to notify ${staff.email}:`, error)
        results.push({
          recipient: `${staff.first_name} ${staff.last_name}`,
          email: staff.email,
          success: false,
          error: error.message
        })
      }
    }

    // Log the weekly check
    const { error: logError } = await supabaseClient
      .from('notifications')
      .insert([{
        template: 'weekly_promotion_check',
        channel: 'email',
        payload: {
          candidatesCount: candidates.length,
          candidates: candidates.map(c => c.student_name),
          notificationsSent: results.filter(r => r.success).length,
          reportDate: new Date().toISOString()
        },
        sent_at: new Date().toISOString(),
        status: 'completed'
      }])

    if (logError) {
      console.error('Failed to log weekly check:', logError)
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return new Response(
      JSON.stringify({
        success: true,
        candidatesCount: candidates.length,
        notificationsSent: successCount,
        notificationsFailed: failureCount,
        staffNotified: results,
        candidates: candidates.map(c => ({
          name: c.student_name,
          belt: c.current_belt,
          avgClasses: c.avg_classes_per_week
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Weekly promotion check error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})