import { createClient } from '@supabase/supabase-js';

const url = 'https://mcpbxawetfcleprkgkvn.supabase.co';
const key = 'sb_publishable_YUpfKPXA2F3B7OZRypDZqg_dg_Jzrco';

const client = createClient(url, key);

async function testConnection() {
  console.log('Testing Supabase connection...');
  const { data, error } = await client.from('businesses').select('*').limit(1);
  if (error) {
    console.log('Query result error:', error);
  } else {
    console.log('Query result data:', data);
  }
}

testConnection();

