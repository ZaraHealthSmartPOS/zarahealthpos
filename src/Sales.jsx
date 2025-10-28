import React, { useEffect, useState } from "react";
import LayoutFrame from "./components/LayoutFrame";
import { formatNaira } from "./utils/currency";

const Sales = () => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("inventoryData");
    if (saved) setInventory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("inventoryData", JSON.stringify(inventory));
  }, [inventory]);

  const addToCart = (item) => {
    if (item.stock <= 0) return;
    setCart(prev => {
      const ex = prev.find(p => p.id === item.id);
      if (ex) return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(1, Number(qty)) } : c));
  };

  const removeFromCart = id => setCart(prev => prev.filter(c => c.id !== id));

  const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);

  const handleCheckout = () => {
    const updated = inventory.map(i => {
      const sold = cart.find(c => c.id === i.id);
      if (sold) return { ...i, stock: Math.max(0, i.stock - sold.quantity) };
      return i;
    });
    setInventory(updated);
    localStorage.setItem("inventoryData", JSON.stringify(updated));

    const salesHistory = JSON.parse(localStorage.getItem("salesHistory") || "[]");
    salesHistory.unshift({
      id: Date.now(),
      items: cart,
      total,
      date: new Date().toISOString()
    });
    localStorage.setItem("salesHistory", JSON.stringify(salesHistory));

    setCart([]);
    alert("✅ Sale completed");
  };

  return (
    <LayoutFrame>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">Available Products</h2>
          <div className="grid grid-cols-2 gap-3">
            {inventory.length === 0 && <div className="col-span-2 text-gray-500">No products</div>}
            {inventory.map(it => (
              <div key={it.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-gray-500">{formatNaira(it.price)} • {it.stock} in stock</div>
                </div>
                <div>
                  <button
                    onClick={() => addToCart(it)}
                    disabled={it.stock <= 0}
                    className={`px-3 py-1 rounded text-white ${it.stock <= 0 ? "bg-gray-300" : "bg-green-600 hover:bg-green-700"}`}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4">Cart</h2>

          {cart.length === 0 ? (
            <p className="text-gray-500">Cart is empty</p>
          ) : (
            <div className="space-y-3">
              {cart.map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-500">{formatNaira(c.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={c.quantity}
                      min="1"
                      onChange={e => updateQty(c.id, e.target.value)}
                      className="w-16 border rounded px-2 py-1 text-right"
                    />
                    <div className="w-28 text-right">{formatNaira(c.price * c.quantity)}</div>
                    <button onClick={() => removeFromCart(c.id)} className="text-red-600">Remove</button>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t flex items-center justify-between">
                <div className="text-lg font-semibold">Total</div>
                <div className="text-lg font-semibold">{formatNaira(total)}</div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setCart([])} className="px-4 py-2 border rounded">Clear</button>
                <button onClick={handleCheckout} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Complete Sale</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </LayoutFrame>
  );
};

export default Sales;
