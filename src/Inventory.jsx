// src/Inventory.jsx
import React, { useEffect, useState } from "react";
import {
  getLocalProducts,
  syncProductsFromCloud,
  addOrUpdateProduct,
  updateProductField,
  deleteProduct
} from "./lib/inventoryStore";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [newProduct, setNewProduct] = useState({ product_name: "", price: 0, quantity: 1 });

  useEffect(() => {
    async function load() {
      await syncProductsFromCloud();
      setProducts(await getLocalProducts());
    }
    load();
  }, []);

  async function handleAdd() {
    if (!newProduct.product_name || newProduct.price <= 0 || newProduct.quantity <= 0) return;
    const updated = await addOrUpdateProduct(newProduct);
    setProducts(updated);
    setNewProduct({ product_name: "", price: 0, quantity: 1 });
  }

  async function handleEdit(id, field, value) {
    const updated = await updateProductField(id, field, value);
    setProducts(updated);
  }

  async function handleDelete(id) {
    const updated = await deleteProduct(id);
    setProducts(updated);
  }

  const filtered = products.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Inventory</h2>

      <input
        className="border px-2 py-1 mb-4 w-full"
        placeholder="Search product..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2 mb-4">
        <input
          className="border px-2 py-1"
          placeholder="Product Name"
          value={newProduct.product_name}
          onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
        />
        <input
          type="number"
          className="border px-2 py-1"
          placeholder="Price"
          value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
        />
        <input
          type="number"
          className="border px-2 py-1"
          placeholder="Qty"
          value={newProduct.quantity}
          onChange={(e) => setNewProduct({ ...newProduct, quantity: Number(e.target.value) })}
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleAdd}>
          Add / Update
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">Product</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Qty</th>
            <th className="p-2 border"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td className="p-2 border">
                <input
                  className="w-full"
                  value={p.product_name}
                  onChange={(e) => handleEdit(p.id, "product_name", e.target.value)}
                />
              </td>
              <td className="p-2 border">
                <input
                  type="number"
                  className="w-full"
                  value={p.price}
                  onChange={(e) => handleEdit(p.id, "price", Number(e.target.value))}
                />
              </td>
              <td className="p-2 border">
                <input
                  type="number"
                  className="w-full"
                  value={p.quantity}
                  onChange={(e) => handleEdit(p.id, "quantity", Number(e.target.value))}
                />
              </td>
              <td className="p-2 border text-center">
                <button className="text-red-600" onClick={() => handleDelete(p.id)}>
                  ✖ Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
