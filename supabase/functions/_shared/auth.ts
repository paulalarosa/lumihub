import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function validateAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return { error: 'Missing authorization', status: 401 }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  if (token === supabaseServiceRoleKey) {
    return { isServiceRole: true }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return { error: 'Forbidden: admin only', status: 403 }
  }

  return { user, profile }
}
