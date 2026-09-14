import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get('sku');
  
  const { data: cfg } = await supabase.from('configuracoes').select('*').eq('chave', 'bling_tokens').single();
  const token = cfg?.valor?.access_token;
  
  const response = await fetch(`https://api.bling.com.br/Api/v3/produtos?codigo=${sku}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  const prodId = data.data[0].id;
  const detalhesReq = await fetch(`https://api.bling.com.br/Api/v3/produtos/${prodId}`, {
     headers: { 'Authorization': `Bearer ${token}` }
  });
  const detalhes = await detalhesReq.json();
  
  return NextResponse.json(detalhes);
}
