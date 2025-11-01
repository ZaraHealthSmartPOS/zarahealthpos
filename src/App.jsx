import React, { useState } from "react";
import Inventory from "./Inventory";
import Sales from "./Sales";
import { testRead } from "./tests/testReadSupabase";

export default function App() {
  const [page, setPage] = useState("sales");

  return (
    <div>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-bold">ZaraHealth SmartPOS</div>
          <nav className="space-x-3">
            <button onClick={() => setPage("sales")} className={`px-3 py-1 rounded ${page==="sales" ? "bg-blue-600 text-white" : "text-gray-700"}`}>Sales</button>
            <button onClick={() => setPage("inventory")} className={`px-3 py-1 rounded ${page==="inventory" ? "bg-blue-600 text-white" : "text-gray-700"}`}>Inventory</button>
          </nav>
        </div>
      </header>

      {/* ✅ TEST BUTTON PLACED HERE */}
      <div className="p-4">
        <button
          onClick={testRead}
          style={{
            padding: "8px 12px",
            border: "1px solid black",
            marginBottom: "10px",
            background: "white"
          }}
        >
          Test Supabase Read
        </button>
      </div>

      {page === "inventory" ? <Inventory /> : <Sales />}
    </div>
  );
}
