export interface Contract {
  id: string
  title: string
  client_id: string
  project_id?: string
  status: 'draft' | 'sent' | 'signed'
  created_at: string
  signed_at: string | null
  content: string
  signature_url: string | null
  clients?: {
    name: string
  }
}

export interface Client {
  id: string
  name: string
}
