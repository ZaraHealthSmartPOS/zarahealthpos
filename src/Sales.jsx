// src/Sales.jsx
import React, { useEffect, useState } from "react";
import { getLocalProducts } from "./lib/inventoryStore";
import { completeSale } from "./lib/salesStore";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);

  useEffect(() => {
    async function load() {
      setProducts(await getLocalProducts());
    }
    load();
  }, []);

  function addToCart(product) {
    const existing = cart.find((c) => c.id === product.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === product.id ? { ...c, cartQty: c.cartQty + 1 } : c
        )
      );
    } else {
      setCart([...cart, { ...product, cartQty: 1 }]);
    }
  }

  function changeQty(id, qty) {
    setCart(cart.map((c) => (c.id === id ? { ...c, cartQty: Number(qty) } : c)));
  }

  function removeFromCart(id) {
    setCart(cart.filter((c) => c.id !== id));
  }

  async function handleCheckout() {
    if (cart.length === 0) return alert("Cart is empty");
    await completeSale(cart);
    setCart([]);
    alert("✅ Sale Completed");
    setProducts(await getLocalProducts()); // refresh stock display
  }

  const filtered = products.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const total = cart.reduce((sum, item) => sum + item.price * item.cartQty, 0);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Sales / POS</h2>

      <input
        className="border px-2 py-1 mb-3 w-full"
        placeholder="Search product to sell..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        {filtered.map((p) => (
          <button
            key={p.id}
            className="border p-2 rounded shadow hover:bg-gray-100"
            onClick={() => addToCart(p)}
          >
            <div className="font-medium">{p.product_name}</div>
            <div>₦{p.price}</div>
            <div className="text-sm text-gray-600">{p.quantity} in stock</div>
          </button>
        ))}
      </div>

      <h3 className="text-md font-semibold mb-2">Cart</h3>

      {cart.length === 0 ? (
        <p className="text-gray-600">No items in cart.</p>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">Product</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Price</th>
              <th className="border p-2"></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id}>
                <td className="border p-2">{item.product_name}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    value={item.cartQty}
                    className="w-16"
                    onChange={(e) => changeQty(item.id, e.target.value)}
                  />
                </td>
                <td className="border p-2">₦{item.price * item.cartQty}</td>
                <td className="border p-2 text-center">
                  <button className="text-red-600" onClick={() => removeFromCart(item.id)}>
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 flex justify-between items-center">
        <div className="text-xl font-bold">Total: ₦{total}</div>
        <button
          onClick={handleCheckout}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Complete Sale
        </button>
      </div>
    </div>
  );
}
