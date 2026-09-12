const path = require('path');
const fs = require('fs');
const workspaceDir = 'C:\\Users\\User\\Desktop\\site Pet-';
const { createClient } = require(path.join(workspaceDir, 'node_modules', '@supabase', 'supabase-js'));

const supabaseUrl = 'https://dehtqlcevoheqajejjcv.supabase.co';
// Need service role key to upload to storage and bypass RLS if needed, or anon key with bucket policy
const supabaseAnonKey = 'sb_publishable_jwcOkSMB6YQAF1lJc3885w_--sghFSx';

// Let's check service role key from process env or local
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
try {
  const envContent = fs.readFileSync(path.join(workspaceDir, '.env.local'), 'utf8');
  const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (match) {
    serviceKey = match[1].trim();
  }
} catch (e) {}

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const productId = 'cfdaae39-a1b1-418b-8624-8199945b1f61';
  const blingId = '16693207258';

  const hdUrls = [
    'https://orgbling.s3.amazonaws.com/ea15431ddf81b8ef2319ba1be32a00a2/a62f406590b5dc093612acbf523b31ce?AWSAccessKeyId=AKIATCLMSGFXTAGX6WUM&Expires=1789839205&Signature=fMRTqDZ4ERNXck%2FUxyJWH%2F4KrP0%3D',
    'https://orgbling.s3.amazonaws.com/ea15431ddf81b8ef2319ba1be32a00a2/1dfed1f8e21bae88136a2edc07939b70?AWSAccessKeyId=AKIATCLMSGFXTAGX6WUM&Expires=1789839205&Signature=EvWf9BKMsbcMjtGefG%2FxKTeTHkA%3D',
    'https://orgbling.s3.amazonaws.com/ea15431ddf81b8ef2319ba1be32a00a2/83f1db14d3ac97ea5e1e5aa7be02541b?AWSAccessKeyId=AKIATCLMSGFXTAGX6WUM&Expires=1789839205&Signature=LNBbEn3yB99cp8WYGGtVEN7oAxI%3D',
    'https://orgbling.s3.amazonaws.com/ea15431ddf81b8ef2319ba1be32a00a2/1e39352c1edfa1f7d00e447f13464f68?AWSAccessKeyId=AKIATCLMSGFXTAGX6WUM&Expires=1789839205&Signature=ONTJs0fj4qnArS6EKn%2FldfkjlnI%3D'
  ];

  const uploadedUrls = [];

  for (let i = 0; i < hdUrls.length; i++) {
    const url = hdUrls[i];
    console.log(`Downloading HD image ${i + 1}/${hdUrls.length}...`);
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`Failed to download ${url}`);
      continue;
    }
    const buffer = Buffer.from(await resp.arrayBuffer());

    const fileName = `${blingId}/produto_${blingId}_${i}_hd_${Date.now()}.jpg`;
    console.log(`Uploading to Supabase storage: ${fileName}...`);

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('produtos-fotos')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadErr) {
      console.error(`Upload error for ${fileName}:`, uploadErr);
    } else {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/produtos-fotos/${fileName}`;
      uploadedUrls.push(publicUrl);
      console.log(`Success! Public URL: ${publicUrl}`);
    }
  }

  if (uploadedUrls.length > 0) {
    console.log('Updating product in Supabase database...');
    const { data: updateData, error: updateErr } = await supabase
      .from('produtos')
      .update({ imagens: uploadedUrls })
      .eq('id', productId);

    if (updateErr) {
      console.error('Failed to update DB:', updateErr);
    } else {
      console.log('PRODUCT UPDATED SUCCESSFULLY WITH HD IMAGES!');
    }
  }
}

run();
