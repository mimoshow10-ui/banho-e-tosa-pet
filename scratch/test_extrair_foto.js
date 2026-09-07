const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function extrairFoto(img) {
  if (!img) return null;
  if (typeof img === 'string') {
    let clean = img.trim();
    if (clean.startsWith('[')) {
      try { clean = JSON.parse(clean)[0]; } catch(e){}
    }
    if (typeof clean !== 'string') return null;
    const url = clean.split(/[\r\n,]+/)[0].replace(/^[\[\"']+|[\]\"']+$/g, '').trim();
    return url.startsWith('http') ? url : null;
  }
  if (Array.isArray(img) && img.length > 0) return extrairFoto(img[0]);
  return null;
}

async function testAll() {
  let page = 0;
  let validParsed = 0;
  let amazonUrls = 0;
  let nullOrEmpty = 0;

  while (true) {
    const { data } = await supabase.from('produtos').select('id, nome, imagens').range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    data.forEach(p => {
      const url = extrairFoto(p.imagens);
      if (url) {
        if (url.includes('amazonaws.com')) {
          amazonUrls++;
        } else {
          validParsed++;
        }
      } else {
        nullOrEmpty++;
      }
    });
    if (data.length < 1000) break;
    page++;
  }

  console.log('=== TEST EXTRAIR FOTO RESULT ===');
  console.log('Valid Supabase Photo URLs:', validParsed);
  console.log('Amazon S3 URLs:', amazonUrls);
  console.log('Null or Empty Photos:', nullOrEmpty);
}

testAll();
