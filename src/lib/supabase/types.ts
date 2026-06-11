// Tipuri generate manual din schema SQL
// Când ai Supabase CLI: `supabase gen types typescript --local > src/lib/supabase/types.ts`

export type GenderType = 'M' | 'F'
export type StrokeType = 'crawl' | 'spate' | 'bras' | 'crawl_pluta' | 'crawl_ajutatoare'
export type HeatStatus = 'pending' | 'active' | 'completed'
export type UserRole = 'organizator' | 'antrenor' | 'cronometror' | 'staff' | 'parinte'

export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string
          name: string
          city: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          city?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string
          club_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string
          phone?: string
          club_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          club_id?: string | null
          created_at?: string
        }
      }
      swimmers: {
        Row: {
          id: string
          full_name: string
          birth_year: number
          gender: GenderType
          club_id: string
          parent_id: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          birth_year: number
          gender: GenderType
          club_id: string
          parent_id: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          birth_year?: number
          gender?: GenderType
          club_id?: string
          parent_id?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          edition: number
          date: string
          time: string
          location: string
          entry_fee: number
          lanes_count: number
          registration_open: boolean
          registration_deadline: string | null
          seeding_done: boolean
          published: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          edition?: number
          date: string
          time?: string
          location?: string
          entry_fee?: number
          lanes_count?: number
          registration_open?: boolean
          registration_deadline?: string | null
          seeding_done?: boolean
          published?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          edition?: number
          date?: string
          time?: string
          location?: string
          entry_fee?: number
          lanes_count?: number
          registration_open?: boolean
          registration_deadline?: string | null
          seeding_done?: boolean
          published?: boolean
          created_by?: string
          created_at?: string
        }
      }
      user_event_roles: {
        Row: {
          id: string
          user_id: string
          event_id: string
          role: UserRole
          assigned_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          role: UserRole
          assigned_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          role?: UserRole
          assigned_by?: string | null
          created_at?: string
        }
      }
      event_categories: {
        Row: {
          id: string
          event_id: string
          age_group_min: number
          age_group_max: number
          gender: GenderType
          birth_year: number | null
          label: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          age_group_min: number
          age_group_max: number
          gender: GenderType
          birth_year?: number | null
          label: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          age_group_min?: number
          age_group_max?: number
          gender?: GenderType
          birth_year?: number | null
          label?: string
          created_at?: string
        }
      }
      event_probes: {
        Row: {
          id: string
          category_id: string
          stroke: StrokeType
          has_float: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          stroke: StrokeType
          has_float?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          stroke?: StrokeType
          has_float?: boolean
          order_index?: number
          created_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          swimmer_id: string
          probe_id: string
          seed_time: string | null
          registered_at: string
          paid: boolean
          paid_at: string | null
          payment_confirmed_by: string | null
        }
        Insert: {
          id?: string
          swimmer_id: string
          probe_id: string
          seed_time?: string | null
          registered_at?: string
          paid?: boolean
          paid_at?: string | null
          payment_confirmed_by?: string | null
        }
        Update: {
          id?: string
          swimmer_id?: string
          probe_id?: string
          seed_time?: string | null
          registered_at?: string
          paid?: boolean
          paid_at?: string | null
          payment_confirmed_by?: string | null
        }
      }
      heats: {
        Row: {
          id: string
          probe_id: string
          heat_number: number
          status: HeatStatus
          created_at: string
        }
        Insert: {
          id?: string
          probe_id: string
          heat_number: number
          status?: HeatStatus
          created_at?: string
        }
        Update: {
          id?: string
          probe_id?: string
          heat_number?: number
          status?: HeatStatus
          created_at?: string
        }
      }
      heat_lanes: {
        Row: {
          id: string
          heat_id: string
          lane_number: number
          swimmer_id: string | null
          seed_time: string | null
          result_time: string | null
          dns: boolean
          dq: boolean
          recorded_by: string | null
          recorded_at: string | null
        }
        Insert: {
          id?: string
          heat_id: string
          lane_number: number
          swimmer_id?: string | null
          seed_time?: string | null
          result_time?: string | null
          dns?: boolean
          dq?: boolean
          recorded_by?: string | null
          recorded_at?: string | null
        }
        Update: {
          id?: string
          heat_id?: string
          lane_number?: number
          swimmer_id?: string | null
          seed_time?: string | null
          result_time?: string | null
          dns?: boolean
          dq?: boolean
          recorded_by?: string | null
          recorded_at?: string | null
        }
      }
    }
    Functions: {
      has_event_role: {
        Args: { p_event_id: string; p_role: UserRole }
        Returns: boolean
      }
      has_any_event_role: {
        Args: { p_event_id: string }
        Returns: boolean
      }
    }
  }
}
