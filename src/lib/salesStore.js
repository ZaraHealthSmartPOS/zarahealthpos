// src/lib/salesStore.js
import localforage from "localforage";
import { supabase } from "./supabaseClient";
import { getLocalProducts, saveLocalProducts } from "./inventoryStore";

localforage.config({
  name: "zarahealth-pos",
  storeName: "sales"
});

export async function completeSale(cart) {
  const products = await getLocalProducts();
  let updatedInventory = [...products];

  // Reduce inventory
  cart.forEach((item) => {
    updatedInventory = updatedInventory.map((p) =>
      p.id === item.id ? { ...p, quantity: p.quantity - item.cartQty } : p
    );
  });

  await saveLocalProducts(updatedInventory);

  // Sync to cloud
  for (let item of cart) {
    await supabase
      .from("product")
      .update({ quantity: item.quantity - item.cartQty })
      .eq("id", item.id);
  }
}
