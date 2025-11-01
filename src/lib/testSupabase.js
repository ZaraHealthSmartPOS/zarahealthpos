import { supabase } from './supabaseClient';

export async function testWrite() {
  const { data, error } = await supabase
    .from('product')
    .insert([{ product_name: 'Console Test', price: 500 }]);

  if (error) {
    console.error("❌ Write FAILED:", error.message);
  } else {
    console.log("✅ Write SUCCESS:", data);
  }
}
