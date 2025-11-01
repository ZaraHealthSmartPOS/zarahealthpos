// src/lib/inventoryStore.js
import localforage from "localforage";
import { supabase } from "./supabaseClient";

localforage.config({
  name: "zarahealth-pos",
  storeName: "inventory"
});

export async function getLocalProducts() {
  return (await localforage.getItem("products")) || [];
}

export async function saveLocalProducts(products) {
  return await localforage.setItem("products", products);
}

export async function syncProductsFromCloud() {
  const { data, error } = await supabase.from("product").select("*");
  if (!error && data) {
    await saveLocalProducts(data);
  }
}

export async function addOrUpdateProduct(product) {
  // Check if exists
  const local = await getLocalProducts();
  const found = local.find(
    (p) => p.product_name.toLowerCase() === product.product_name.toLowerCase()
  );

  if (found) {
    // Update quantity
    const newQty = found.quantity + product.quantity;
    await supabase.from("product").update({ quantity: newQty }).eq("id", found.id);

    const updated = local.map((p) => (p.id === found.id ? { ...p, quantity: newQty } : p));
    await saveLocalProducts(updated);
    return updated;
  }

  // Insert new
  const { data, error } = await supabase.from("product").insert([product]).select();
  if (error) return local;

  const updated = [...local, data[0]];
  await saveLocalProducts(updated);
  return updated;
}

export async function updateProductField(id, field, value) {
  await supabase.from("product").update({ [field]: value }).eq("id", id);
  const local = await getLocalProducts();
  const updated = local.map((p) => (p.id === id ? { ...p, [field]: value } : p));
  await saveLocalProducts(updated);
  return updated;
}

export async function deleteProduct(id) {
  await supabase.from("product").delete().eq("id", id);
  const local = await getLocalProducts();
  const updated = local.filter((p) => p.id !== id);
  await saveLocalProducts(updated);
  return updated;
}
