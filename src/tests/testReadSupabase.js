import { supabase } from "../lib/supabaseClient";

export async function testRead() {
  const { data, error } = await supabase
    .from("product")
    .select("*");

  if (error) {
    console.error("❌ Read FAILED:", error.message);
  } else {
    console.log("✅ Read SUCCESS:", data);
  }
}
