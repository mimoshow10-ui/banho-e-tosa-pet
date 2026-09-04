const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vvyedzstlhukqndqploa.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOtp() {
  console.log("Tentando enviar OTP via Supabase Auth para mimoshow01@gmail.com...");
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'mimoshow01@gmail.com',
    options: {
      shouldCreateUser: true
    }
  });

  console.log("Resultado Supabase Auth:", { data, error });
}

testOtp();
