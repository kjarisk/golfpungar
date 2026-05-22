export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'announcements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'announcements_tournament_id_fkey'
            columns: ['tournament_id']
            isOneToOne: false
            referencedRelation: 'tournaments'
            referencedColumns: ['id']
          },
        ]
      }
      bet_participants: {
        Row: {
          accepted: boolean | null
          bet_id: string
          id: string
          paid_confirmed: boolean
          player_id: string
        }
        Insert: {
          accepted?: boolean | null
          bet_id: string
          id?: string
          paid_confirmed?: boolean
          player_id: string
        }
        Update: {
          accepted?: boolean | null
          bet_id?: string
          id?: string
          paid_confirmed?: boolean
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bet_participants_bet_id_fkey'
            columns: ['bet_id']
            isOneToOne: false
            referencedRelation: 'bets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bet_participants_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      bets: {
        Row: {
          amount: number
          created_at: string
          created_by_player_id: string | null
          creator_paid_confirmed: boolean
          custom_description: string | null
          id: string
          metric_key: Database['public']['Enums']['bet_metric']
          round_id: string | null
          scope: Database['public']['Enums']['bet_scope']
          status: Database['public']['Enums']['bet_status']
          tournament_id: string
          winner_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by_player_id?: string | null
          creator_paid_confirmed?: boolean
          custom_description?: string | null
          id?: string
          metric_key: Database['public']['Enums']['bet_metric']
          round_id?: string | null
          scope: Database['public']['Enums']['bet_scope']
          status?: Database['public']['Enums']['bet_status']
          tournament_id: string
          winner_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by_player_id?: string | null
          creator_paid_confirmed?: boolean
          custom_description?: string | null
          id?: string
          metric_key?: Database['public']['Enums']['bet_metric']
          round_id?: string | null
          scope?: Database['public']['Enums']['bet_scope']
          status?: Database['public']['Enums']['bet_status']
          tournament_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'bets_created_by_player_id_fkey'
            columns: ['created_by_player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bets_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bets_tournament_id_fkey'
            columns: ['tournament_id']
            isOneToOne: false
            referencedRelation: 'tournaments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bets_winner_id_fkey'
            columns: ['winner_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      countries: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          country_id: string | null
          created_at: string
          id: string
          name: string
          source: Database['public']['Enums']['course_source']
          tournament_id: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          id?: string
          name: string
          source?: Database['public']['Enums']['course_source']
          tournament_id: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          id?: string
          name?: string
          source?: Database['public']['Enums']['course_source']
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'courses_country_id_fkey'
            columns: ['country_id']
            isOneToOne: false
            referencedRelation: 'countries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'courses_tournament_id_fkey'
            columns: ['tournament_id']
            isOneToOne: false
            referencedRelation: 'tournaments'
            referencedColumns: ['id']
          },
        ]
      }
      evidence_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          side_event_log_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          side_event_log_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          side_event_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'evidence_images_side_event_log_id_fkey'
            columns: ['side_event_log_id']
            isOneToOne: false
            referencedRelation: 'side_event_logs'
            referencedColumns: ['id']
          },
        ]
      }
      feed_events: {
        Row: {
          created_at: string
          id: string
          message: string
          player_id: string | null
          round_id: string | null
          team_id: string | null
          tournament_id: string
          type: Database['public']['Enums']['feed_event_type']
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          player_id?: string | null
          round_id?: string | null
          team_id?: string | null
          tournament_id: string
          type: Database['public']['Enums']['feed_event_type']
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          player_id?: string | null
          round_id?: string | null
          team_id?: string | null
          tournament_id?: string
          type?: Database['public']['Enums']['feed_event_type']
        }
        Relationships: [
          {
            foreignKeyName: 'feed_events_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feed_events_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feed_events_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feed_events_tournament_id_fkey'
            columns: ['tournament_id']
            isOneToOne: false
            referencedRelation: 'tournaments'
            referencedColumns: ['id']
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          player_id: string
        }
        Insert: {
          group_id: string
          player_id: string
        }
        Update: {
          group_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_members_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          name: string
          round_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          round_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
        ]
      }
      holes: {
        Row: {
          course_id: string
          hole_number: number
          id: string
          par: number
          stroke_index: number
        }
        Insert: {
          course_id: string
          hole_number: number
          id?: string
          par: number
          stroke_index: number
        }
        Update: {
          course_id?: string
          hole_number?: number
          id?: string
          par?: number
          stroke_index?: number
        }
        Relationships: [
          {
            foreignKeyName: 'holes_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          linked_person_id: string | null
          role: Database['public']['Enums']['user_role']
          status: Database['public']['Enums']['invite_status']
          token: string
          tournament_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          linked_person_id?: string | null
          role?: Database['public']['Enums']['user_role']
          status?: Database['public']['Enums']['invite_status']
          token: string
          tournament_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          linked_person_id?: string | null
          role?: Database['public']['Enums']['user_role']
          status?: Database['public']['Enums']['invite_status']
          token?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invites_linked_person_id_fkey'
            columns: ['linked_person_id']
            isOneToOne: false
            referencedRelation: 'persons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invites_tournament_id_fkey'
            columns: ['tournament_id']
            isOneToOne: false
            referencedRelation: 'tournaments'
            referencedColumns: ['id']
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: Database['public']['Enums']['ledger_kind']
          note: string
          player_id: string
          round_id: string | null
          tournament_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind?: Database['public']['Enums']['ledger_kind']
          note?: string
          player_id: string
          round_id?: string | null
          tournament_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: Database['public']['Enums']['ledger_kind']
          note?: string
          player_id?: string
          round_id?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ledger_entries_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ledger_entries_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ledger_entries_tournament_id_fkey'
            columns: ['tournament_id']
            isOneToOne: false
            referencedRelation: 'tournaments'
            referencedColumns: ['id']
          },
        ]
      }
      persons: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          nickname: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          nickname?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          nickname?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'persons_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      players: {
        Row: {
          active: boolean
          created_at: string
          group_handicap: number
          id: string
          person_id: string
          tournament_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          group_handicap?: number
          id?: string
          person_id: string
          tournament_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          group_handicap?: number
          id?: string
          person_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'players_person_id_fkey'
            columns: ['person_id']
            isOneToOne: false
            referencedRelation: 'persons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'players_tournament_id_fkey'
            columns: ['tournament_id']
            isOneToOne: false
            referencedRelation: 'tournaments'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          role: Database['public']['Enums']['user_role']
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id: string
          role?: Database['public']['Enums']['user_role']
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          role?: Database['public']['Enums']['user_role']
        }
        Relationships: []
      }
      round_approvals: {
        Row: {
          approved_at: string
          approved_by: string | null
          id: string
          player_id: string
          round_id: string
        }
        Insert: {
          approved_at?: string
          approved_by?: string | null
          id?: string
          player_id: string
          round_id: string
        }
        Update: {
          approved_at?: string
          approved_by?: string | null
          id?: string
          player_id?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'round_approvals_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'round_approvals_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'round_approvals_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
        ]
      }
      rounds: {
        Row: {
          course_id: string
          created_at: string
          date_time: string | null
          deleted: boolean
          format: Database['public']['Enums']['round_format']
          holes_played: number
          id: string
          name: string
          points_table: number[] | null
          status: Database['public']['Enums']['round_status']
          tournament_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          date_time?: string | null
          deleted?: boolean
          format: Database['public']['Enums']['round_format']
          holes_played: number
          id?: string
          name: string
          points_table?: number[] | null
          status?: Database['public']['Enums']['round_status']
          tournament_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          date_time?: string | null
          deleted?: boolean
          format?: Database['public']['Enums']['round_format']
          holes_played?: number
          id?: string
          name?: string
          points_table?: number[] | null
          status?: Database['public']['Enums']['round_status']
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rounds_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rounds_tournament_id_fkey'
            columns: ['tournament_id']
            isOneToOne: false
            referencedRelation: 'tournaments'
            referencedColumns: ['id']
          },
        ]
      }
      scorecards: {
        Row: {
          created_at: string
          hole_strokes: Json
          id: string
          is_complete: boolean
          player_id: string | null
          round_id: string
          team_id: string | null
        }
        Insert: {
          created_at?: string
          hole_strokes?: Json
          id?: string
          is_complete?: boolean
          player_id?: string | null
          round_id: string
          team_id?: string | null
        }
        Update: {
          created_at?: string
          hole_strokes?: Json
          id?: string
          is_complete?: boolean
          player_id?: string | null
          round_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'scorecards_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scorecards_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scorecards_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      side_event_logs: {
        Row: {
          created_at: string
          created_by_player_id: string | null
          hole_number: number | null
          id: string
          player_id: string
          round_id: string | null
          tournament_id: string
          type: Database['public']['Enums']['side_event_type']
          value: number | null
        }
        Insert: {
          created_at?: string
          created_by_player_id?: string | null
          hole_number?: number | null
          id?: string
          player_id: string
          round_id?: string | null
          tournament_id: string
          type: Database['public']['Enums']['side_event_type']
          value?: number | null
        }
        Update: {
          created_at?: string
          created_by_player_id?: string | null
          hole_number?: number | null
          id?: string
          player_id?: string
          round_id?: string | null
          tournament_id?: string
          type?: Database['public']['Enums']['side_event_type']
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'side_event_logs_created_by_player_id_fkey'
            columns: ['created_by_player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'side_event_logs_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'side_event_logs_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'side_event_logs_tournament_id_fkey'
            columns: ['tournament_id']
            isOneToOne: false
            referencedRelation: 'tournaments'
            referencedColumns: ['id']
          },
        ]
      }
      team_members: {
        Row: {
          player_id: string
          team_id: string
        }
        Insert: {
          player_id: string
          team_id: string
        }
        Update: {
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'team_members_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          round_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          round_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teams_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          },
        ]
      }
      tournaments: {
        Row: {
          country_id: string | null
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          location: string | null
          name: string
          start_date: string
          status: Database['public']['Enums']['tournament_status']
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          location?: string | null
          name: string
          start_date: string
          status?: Database['public']['Enums']['tournament_status']
        }
        Update: {
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          location?: string | null
          name?: string
          start_date?: string
          status?: Database['public']['Enums']['tournament_status']
        }
        Relationships: [
          {
            foreignKeyName: 'tournaments_country_id_fkey'
            columns: ['country_id']
            isOneToOne: false
            referencedRelation: 'countries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tournaments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bet_metric: 'most_points' | 'most_birdies' | 'head_to_head' | 'custom'
      bet_scope: 'round' | 'tournament'
      bet_status: 'pending' | 'accepted' | 'rejected' | 'won' | 'lost' | 'paid'
      course_source: 'csv' | 'manual'
      feed_event_type:
        | 'score_entered'
        | 'points_calculated'
        | 'side_event'
        | 'round_started'
        | 'round_completed'
        | 'tournament_update'
        | 'team_name_changed'
        | 'announcement'
        | 'handicap_changed'
        | 'bet'
      invite_status: 'pending' | 'accepted' | 'expired'
      ledger_kind: 'penalty'
      round_format: 'scramble' | 'stableford' | 'bestball' | 'handicap'
      round_status: 'upcoming' | 'active' | 'pending_approval' | 'completed'
      side_event_type:
        | 'birdie'
        | 'eagle'
        | 'hio'
        | 'albatross'
        | 'bunker_save'
        | 'snake'
        | 'snopp'
        | 'group_longest_drive'
        | 'longest_drive_meters'
        | 'longest_putt'
        | 'nearest_to_pin'
        | 'gir'
      tournament_status: 'draft' | 'live' | 'done'
      user_role: 'admin' | 'player'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bet_metric: ['most_points', 'most_birdies', 'head_to_head', 'custom'],
      bet_scope: ['round', 'tournament'],
      bet_status: ['pending', 'accepted', 'rejected', 'won', 'lost', 'paid'],
      course_source: ['csv', 'manual'],
      feed_event_type: [
        'score_entered',
        'points_calculated',
        'side_event',
        'round_started',
        'round_completed',
        'tournament_update',
        'team_name_changed',
        'announcement',
        'handicap_changed',
        'bet',
      ],
      invite_status: ['pending', 'accepted', 'expired'],
      ledger_kind: ['penalty'],
      round_format: ['scramble', 'stableford', 'bestball', 'handicap'],
      round_status: ['upcoming', 'active', 'pending_approval', 'completed'],
      side_event_type: [
        'birdie',
        'eagle',
        'hio',
        'albatross',
        'bunker_save',
        'snake',
        'snopp',
        'group_longest_drive',
        'longest_drive_meters',
        'longest_putt',
        'nearest_to_pin',
        'gir',
      ],
      tournament_status: ['draft', 'live', 'done'],
      user_role: ['admin', 'player'],
    },
  },
} as const
