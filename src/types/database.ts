/**
 * Tipe database untuk supabase-js.
 *
 * Ditulis mengikuti format `supabase gen types typescript`. Setelah project
 * Supabase-mu jalan, file ini bisa diperbarui otomatis dengan:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PaymentStatus = 'menunggu_pembayaran' | 'menunggu_verifikasi' | 'lunas' | 'ditolak'

export type CheckInResult = 'berhasil' | 'sudah' | 'belum_lunas' | 'tidak_valid'

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: { user_id: string; created_at: string }
        Insert: { user_id: string; created_at?: string }
        Update: { user_id?: string; created_at?: string }
        Relationships: []
      }
      participants: {
        Row: {
          id: string
          full_name: string
          nim: string
          email: string
          phone: string
          major: string
          token: string
          payment_status: PaymentStatus
          payment_proof_path: string | null
          proof_uploaded_at: string | null
          rejection_reason: string | null
          verified_at: string | null
          verified_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          nim: string
          email: string
          phone: string
          major: string
          token?: string
          payment_status?: PaymentStatus
          payment_proof_path?: string | null
          proof_uploaded_at?: string | null
          rejection_reason?: string | null
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          nim?: string
          email?: string
          phone?: string
          major?: string
          token?: string
          payment_status?: PaymentStatus
          payment_proof_path?: string | null
          proof_uploaded_at?: string | null
          rejection_reason?: string | null
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          id: string
          participant_id: string
          checked_in_at: string
          checked_in_by: string | null
        }
        Insert: {
          id?: string
          participant_id: string
          checked_in_at?: string
          checked_in_by?: string | null
        }
        Update: {
          id?: string
          participant_id?: string
          checked_in_at?: string
          checked_in_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'checkins_participant_id_fkey'
            columns: ['participant_id']
            isOneToOne: true
            referencedRelation: 'participants'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      register_participant: {
        Args: {
          p_full_name: string
          p_nim: string
          p_email: string
          p_phone: string
          p_major: string
        }
        Returns: string
      }
      get_participant_by_token: {
        Args: { p_token: string }
        Returns: {
          full_name: string
          nim: string
          email: string
          major: string
          payment_status: PaymentStatus
          rejection_reason: string | null
          proof_uploaded_at: string | null
          created_at: string
          checked_in_at: string | null
        }[]
      }
      submit_payment_proof: {
        Args: { p_token: string; p_path: string }
        Returns: PaymentStatus
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      verify_payment: {
        Args: { p_participant_id: string; p_approve: boolean; p_reason?: string | null }
        Returns: PaymentStatus
      }
      check_in: {
        Args: { p_token?: string | null; p_participant_id?: string | null }
        Returns: {
          result: CheckInResult
          participant_id: string | null
          full_name: string | null
          nim: string | null
          major: string | null
          checked_in_at: string | null
        }[]
      }
      undo_check_in: { Args: { p_participant_id: string }; Returns: boolean }
      dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total: number
          menunggu_pembayaran: number
          menunggu_verifikasi: number
          lunas: number
          ditolak: number
          checked_in: number
        }[]
      }
    }
    Enums: { payment_status: PaymentStatus }
    CompositeTypes: { [_ in never]: never }
  }
}
