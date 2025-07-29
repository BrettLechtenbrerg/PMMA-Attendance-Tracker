import { supabase } from './supabase'

export interface NotificationTemplate {
  id: string
  name: string
  type: 'absence_alert' | 'birthday_reminder' | 'promotion_ready' | 'class_reminder'
  subject: string
  message: string
  channel: 'sms' | 'email'
}

export const notificationTemplates: NotificationTemplate[] = [
  {
    id: 'absence_3_days',
    name: 'Absence Alert (3 days)',
    type: 'absence_alert',
    subject: 'We Miss You at PMMA!',
    message: `Hi {student_name}! We haven't seen you in the dojo for a few days. We hope everything is going well. Remember, consistent training is key to your martial arts journey. We look forward to seeing you back on the mat soon!`,
    channel: 'email'
  },
  {
    id: 'absence_1_week',
    name: 'Absence Alert (1 week)',
    type: 'absence_alert',
    subject: 'Missing You at PMMA',
    message: `Hello {parent_name}, we wanted to reach out because {student_name} hasn't been to class in over a week. If there's anything we can help with or if you have questions about the program, please don't hesitate to contact us.`,
    channel: 'email'
  },
  {
    id: 'birthday_reminder',
    name: 'Birthday Greeting',
    type: 'birthday_reminder',
    subject: 'Happy Birthday from PMMA!',
    message: `🎉 Happy Birthday {student_name}! The entire PMMA family wishes you a fantastic day. We're honored to be part of your martial arts journey. Here's to another year of growth, strength, and achievement!`,
    channel: 'email'
  },
  {
    id: 'promotion_eligible',
    name: 'Promotion Ready',
    type: 'promotion_ready',
    subject: 'Belt Promotion Opportunity',
    message: `Congratulations {student_name}! Your consistent attendance and dedication have prepared you for your next belt level. Please speak with your instructor about scheduling your promotion test.`,
    channel: 'email'
  },
  {
    id: 'class_reminder_24h',
    name: 'Class Reminder (24h)',
    type: 'class_reminder',
    subject: 'Class Reminder - Tomorrow',
    message: `Hi {student_name}! Just a friendly reminder that you have {class_type} class tomorrow at {class_time}. We look forward to seeing you on the mat!`,
    channel: 'sms'
  }
]

export const notificationService = {
  /**
   * Send notification using Supabase Edge Function
   */
  async sendNotification(request: {
    type: string
    studentIds?: string[]
    parentIds?: string[]
    message: string
    channel: 'sms' | 'email'
    metadata?: Record<string, any>
  }) {
    const { data, error } = await supabase.functions.invoke('send-notifications', {
      body: request
    })

    if (error) {
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return data
  },

  /**
   * Check for students with absence patterns and send alerts
   */
  async checkAbsenceAlerts(): Promise<{ sent: number; errors: string[] }> {
    try {
      // Get students who haven't attended in 3+ days
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const { data: absentStudents, error } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          email,
          parent_students(
            parent:parents(
              user:users(id, email, first_name, last_name)
            )
          )
        `)
        .eq('status', 'Active')
        .not('id', 'in', `(
          SELECT DISTINCT student_id 
          FROM attendance 
          WHERE check_in_time >= '${threeDaysAgo.toISOString()}'
        )`)

      if (error) {
        throw new Error(`Failed to fetch absent students: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      let sent = 0
      const errors: string[] = []

      for (const student of absentStudents || []) {
        try {
          const studentName = `${student.first_name} ${student.last_name}`
          const message = notificationTemplates
            .find(t => t.id === 'absence_3_days')
            ?.message.replace('{student_name}', studentName) || 
            `Hi ${studentName}! We haven't seen you in the dojo recently. Hope to see you back soon!`

          // Get parent emails
          const parentIds = student.parent_students
            ?.map((ps: any) => ps.parent?.user?.id)
            .filter(Boolean) || []

          if (parentIds.length > 0) {
            await this.sendNotification({
              type: 'absence_alert',
              parentIds,
              message,
              channel: 'email',
              metadata: { studentId: student.id, studentName }
            })
            sent++
          } else if (student.email) {
            // Send directly to student if no parents linked
            await this.sendNotification({
              type: 'absence_alert',
              studentIds: [student.id],
              message,
              channel: 'email',
              metadata: { studentName }
            })
            sent++
          }
        } catch (error) {
          errors.push(`Failed to send absence alert for ${student.first_name} ${student.last_name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return { sent, errors }
    } catch (error) {
      throw new Error(`Absence alert check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Check for birthdays today and send greetings
   */
  async checkBirthdayReminders(): Promise<{ sent: number; errors: string[] }> {
    try {
      const today = new Date()
      const todayMonth = today.getMonth() + 1
      const todayDay = today.getDate()

      const { data: birthdayStudents, error } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          email,
          parent_students(
            parent:parents(
              user:users(id, email, first_name, last_name)
            )
          )
        `)
        .eq('status', 'Active')
        .not('date_of_birth', 'is', null)

      if (error) {
        throw new Error(`Failed to fetch students: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Filter for today's birthdays
      const todaysBirthdays = birthdayStudents?.filter(student => {
        if (!student.date_of_birth) return false
        const birthDate = new Date(student.date_of_birth)
        return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay
      }) || []

      let sent = 0
      const errors: string[] = []

      for (const student of todaysBirthdays) {
        try {
          const studentName = `${student.first_name} ${student.last_name}`
          const message = notificationTemplates
            .find(t => t.id === 'birthday_reminder')
            ?.message.replace('{student_name}', studentName) || 
            `🎉 Happy Birthday ${studentName}! Have a wonderful day!`

          // Get parent emails
          const parentIds = student.parent_students
            ?.map((ps: any) => ps.parent?.user?.id)
            .filter(Boolean) || []

          if (parentIds.length > 0) {
            await this.sendNotification({
              type: 'birthday_reminder',
              parentIds,
              message,
              channel: 'email',
              metadata: { studentId: student.id, studentName }
            })
            sent++
          } else if (student.email) {
            // Send directly to student if no parents linked
            await this.sendNotification({
              type: 'birthday_reminder',
              studentIds: [student.id],
              message,
              channel: 'email',
              metadata: { studentName }
            })
            sent++
          }
        } catch (error) {
          errors.push(`Failed to send birthday greeting for ${student.first_name} ${student.last_name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return { sent, errors }
    } catch (error) {
      throw new Error(`Birthday reminder check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Trigger weekly promotion check
   */
  async triggerWeeklyPromotionCheck() {
    const { data, error } = await supabase.functions.invoke('weekly-promotion-check')

    if (error) {
      throw new Error(`Weekly promotion check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return data
  },

  /**
   * Get notification history
   */
  async getNotificationHistory(limit: number = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        student:students(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch notification history: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return data
  },

  /**
   * Get notification templates
   */
  getTemplates() {
    return notificationTemplates
  },

  /**
   * Send custom notification
   */
  async sendCustomNotification(
    recipients: { type: 'student' | 'parent', ids: string[] },
    template: NotificationTemplate,
    customMessage?: string
  ) {
    const message = customMessage || template.message

    const request = {
      type: template.type,
      message,
      channel: template.channel,
      metadata: { templateId: template.id }
    }

    if (recipients.type === 'student') {
      (request as any)['studentIds'] = recipients.ids
    } else {
      (request as any)['parentIds'] = recipients.ids
    }

    return await this.sendNotification(request)
  }
}