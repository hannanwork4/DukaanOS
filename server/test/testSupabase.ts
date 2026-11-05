import { createClient } from '@supabase/supabase-js';

const url = 'https://mcpbxawetfcleprkgkvn.supabase.co';
const key = 'sb_publishable_YUpfKPXA2F3B7OZRypDZqg_dg_Jzrco';

const client = createClient(url, key);

async function checkCloudStatus() {
  const { data: businesses } = await client.from('businesses').select('*');
  const { data: products } = await client.from('products').select('*');
  const { data: suppliers } = await client.from('suppliers').select('*');
  const { data: purchases } = await client.from('purchases').select('*');
  const { data: sales } = await client.from('sales').select('*');

  console.log(`Cloud DB Status:
  Businesses: ${businesses?.length || 0}
  Products: ${products?.length || 0}
  Suppliers: ${suppliers?.length || 0}
  Purchases: ${purchases?.length || 0}
  Sales: ${sales?.length || 0}`);
}

checkCloudStatus();
