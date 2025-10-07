import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface User {
  id: string
  user_id: string
  username: string
  email: string
  full_name: string | null
  role: 'admin' | 'programador' | 'contable'
  status: 'active' | 'inactive' | 'suspended'
  department: string | null
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface DeliveryGuide {
  id: string
  guide_number: string
  customer_id: string | null
  supplier_id: string | null
  date: string
  transport_reason: string | null
  transport_modality: string | null
  carrier_document: string | null
  carrier_name: string | null
  vehicle_plate: string | null
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  document_type: 'DNI' | 'RUC' | 'CE'
  document_number: string
  email: string | null
  phone: string | null
  address: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  document_type: 'DNI' | 'RUC' | 'CE'
  document_number: string
  email: string | null
  phone: string | null
  address: string | null
  contact_person: string | null
  active: boolean
  created_at: string
  updated_at: string
}