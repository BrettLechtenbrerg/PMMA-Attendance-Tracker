export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'owner' | 'manager' | 'instructor' | 'parent'
          first_name: string | null
          last_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'owner' | 'manager' | 'instructor' | 'parent'
          first_name?: string | null
          last_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'owner' | 'manager' | 'instructor' | 'parent'
          first_name?: string | null
          last_name?: string | null
          created_at?: string
        }
      }
      parents: {
        Row: {
          user_id: string
          family_qr_code: string
        }
        Insert: {
          user_id: string
          family_qr_code: string
        }
        Update: {
          user_id?: string
          family_qr_code?: string
        }
      }
      students: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          belt_color: 'White' | 'Yellow' | 'Orange' | 'Green' | 'Blue' | 'Purple' | 'Brown' | 'Red' | 'Black'
          program: 'Basic' | 'Masters Club' | 'Leadership'
          status: 'Active' | 'Vacation' | 'Medical' | 'Hiatus' | 'Past'
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          qr_code: string
          profile_photo_url: string | null
          medical_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          belt_color?: 'White' | 'Yellow' | 'Orange' | 'Green' | 'Blue' | 'Purple' | 'Brown' | 'Red' | 'Black'
          program?: 'Basic' | 'Masters Club' | 'Leadership'
          status?: 'Active' | 'Vacation' | 'Medical' | 'Hiatus' | 'Past'
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          qr_code: string
          profile_photo_url?: string | null
          medical_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          belt_color?: 'White' | 'Yellow' | 'Orange' | 'Green' | 'Blue' | 'Purple' | 'Brown' | 'Red' | 'Black'
          program?: 'Basic' | 'Masters Club' | 'Leadership'
          status?: 'Active' | 'Vacation' | 'Medical' | 'Hiatus' | 'Past'
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          qr_code?: string
          profile_photo_url?: string | null
          medical_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      parent_students: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
      }
      classes: {
        Row: {
          id: string
          class_type: 'Tiny Tigers' | 'Kids' | 'Teens' | 'Adults' | 'Weapons' | 'Black Belt'
          start_time: string
          end_time: string
          instructor_id: string | null
          location: string
        }
        Insert: {
          id?: string
          class_type?: 'Tiny Tigers' | 'Kids' | 'Teens' | 'Adults' | 'Weapons' | 'Black Belt'
          start_time: string
          end_time: string
          instructor_id?: string | null
          location?: string
        }
        Update: {
          id?: string
          class_type?: 'Tiny Tigers' | 'Kids' | 'Teens' | 'Adults' | 'Weapons' | 'Black Belt'
          start_time?: string
          end_time?: string
          instructor_id?: string | null
          location?: string
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string | null
          class_id: string | null
          check_in_time: string
          notes: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          student_id?: string | null
          class_id?: string | null
          check_in_time?: string
          notes?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          student_id?: string | null
          class_id?: string | null
          check_in_time?: string
          notes?: string | null
          created_by?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          student_id: string | null
          template: string | null
          channel: string | null
          payload: any | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          id?: string
          student_id?: string | null
          template?: string | null
          channel?: string | null
          payload?: any | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          student_id?: string | null
          template?: string | null
          channel?: string | null
          payload?: any | null
          sent_at?: string | null
          status?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      belt_color_t: 'White' | 'Yellow' | 'Orange' | 'Green' | 'Blue' | 'Purple' | 'Brown' | 'Red' | 'Black'
      program_t: 'Basic' | 'Masters Club' | 'Leadership'
      student_status_t: 'Active' | 'Vacation' | 'Medical' | 'Hiatus' | 'Past'
      user_role_t: 'owner' | 'manager' | 'instructor' | 'parent'
      class_type_t: 'Tiny Tigers' | 'Kids' | 'Teens' | 'Adults' | 'Weapons' | 'Black Belt'
    }
  }
}