import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co'
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
