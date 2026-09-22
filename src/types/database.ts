export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          logo_url: string | null
          whatsapp: string | null
          whatsapp_message: string | null
          subscription_status: 'trial' | 'active' | 'past_due' | 'canceled'
          subscription_plan: string
          subscription_expires_at: string
          mercadopago_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          logo_url?: string | null
          whatsapp?: string | null
          whatsapp_message?: string | null
          subscription_status?: 'trial' | 'active' | 'past_due' | 'canceled'
          subscription_plan?: string
          subscription_expires_at?: string
          mercadopago_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          whatsapp?: string | null
          whatsapp_message?: string | null
          subscription_status?: 'trial' | 'active' | 'past_due' | 'canceled'
          subscription_plan?: string
          subscription_expires_at?: string
          mercadopago_payment_id?: string | null
          created_at?: string
        }
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          order?: number
          created_at?: string
        }
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          category_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_active: boolean
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          category_id: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_active?: boolean
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_active?: boolean
          order?: number
          created_at?: string
        }
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
    }
    Views: Record<string, {
      Row: Record<string, unknown>
      Relationships: {
        foreignKeyName: string
        columns: string[]
        isOneToOne?: boolean
        referencedRelation: string
        referencedColumns: string[]
      }[]
    }>
    Functions: Record<string, {
      Args: Record<string, unknown>
      Returns: unknown
    }>
  }
}

// Tipos convenientes
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']

export type CategoryWithItems = Category & {
  menu_items: MenuItem[]
}
