import React, { useState, useEffect } from "react";
import LayoutFrame from "./components/LayoutFrame";
import { formatNaira } from "./utils/currency";

const Inventory = () => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("inventoryData");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: "Paracetamol 500mg", price: 50, stock: 100, expiry: "2025-12-20" },
          { id: 2, name: "Vitamin C 1000mg", price: 100, stock: 50, expiry: "2025-11-05" },
          { id: 3, name: "Amoxicillin 250mg", price: 250, stock: 25, expiry: "2026-01-10" },
        ];
  });

  useEffect(() => {
    localStorage.setItem("inventoryData", JSON.stringify(items));
  }, [items]);

  const handleChange = (id, field, value) => {
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: (field === "price" || field === "stock") ? Number(value) : value } : item)
    );
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), name: "", price: 0, stock: 0, expiry: "" },
    ]);
  };

  const handleDelete = id => setItems(prev => prev.filter(i => i.id !== id));

  const totalValue = items.reduce((s, it) => s + it.price * it.stock, 0);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { text: "No Date", color: "text-gray-400 bg-transparent" };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: "Expired", color: "text-red-700 bg-red-100" };
    if (diffDays <= 30) return { text: `${diffDays}d`, color: "text-yellow-800 bg-yellow-100" };
    return { text: `${diffDays}d`, color: "text-green-700 bg-green-100" };
  };

  return (
    <LayoutFrame>
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Pharmacy Inventory</h1>
          <div className="space-x-2">
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-zara-lime text-black rounded-lg hover:opacity-90"
            >
              + Add Product
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Stock</th>
                <th className="px-3 py-2 text-left">Value</th>
                <th className="px-3 py-2 text-left">Expiry</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {items.map(item => {
                const expiry = getExpiryStatus(item.expiry);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.name}
                        placeholder="Product name"
                        onChange={e => handleChange(item.id, "name", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.price}
                        onChange={e => handleChange(item.id, "price", e.target.value)}
                        className="w-28 border rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.stock}
                        onChange={e => handleChange(item.id, "stock", e.target.value)}
                        className="w-20 border rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2">{formatNaira(item.price * item.stock)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={item.expiry}
                        onChange={e => handleChange(item.id, "expiry", e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    </td>

                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${expiry.color}`}>
                        {expiry.text}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end items-center gap-4">
          <div className="text-lg font-semibold">Total Inventory Value: {formatNaira(totalValue)}</div>
        </div>
      </div>
    </LayoutFrame>
  );
};

export default Inventory;
