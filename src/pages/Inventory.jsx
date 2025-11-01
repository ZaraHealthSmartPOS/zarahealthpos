// src/pages/Inventory.jsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { queueOperation } from '../lib/offlineSync'
import { useSyncStatus } from '../hooks/useOfflineQueue'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ product_name: '', sku: '', quantity: 0, selling_price: 0, cost_price: 0 })
  const { online } = useSyncStatus()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
    if (error) {
      console.warn('Fetch inventory failed (maybe offline)', error)
      // fallback: could read from local store if you saved cached inventory
      return
    }
    setItems(data || [])
  }

  async function addProduct(e) {
    e.preventDefault()
    const payload = {
      sku: form.sku || undefined,
      product_name: form.product_name,
      quantity: Number(form.quantity),
      selling_price: Number(form.selling_price),
      cost_price: Number(form.cost_price),
      created_at: new Date().toISOString(),
    }
    if (online) {
      // attempt direct insert
      const { error } = await supabase.from('inventory').insert(payload)
      if (error) {
        // queue if fails
        await queueOperation({ op_type: 'inventory_update', payload })
        alert('Added to queue due to error; will sync')
      } else {
        alert('Product added')
        fetchItems()
      }
    } else {
      // offline → queue
      await queueOperation({ op_type: 'inventory_update', payload })
      alert('Product queued (offline)')
    }
    setForm({ product_name: '', sku: '', quantity: 0, selling_price: 0, cost_price: 0 })
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Inventory</h2>
      <form onSubmit={addProduct} className="grid grid-cols-2 gap-3 mb-4">
        <input placeholder="Product name" value={form.product_name} onChange={e=>setForm({...form, product_name: e.target.value})} />
        <input placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku: e.target.value})} />
        <input type="number" placeholder="Quantity" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} />
        <input type="number" placeholder="Selling Price" value={form.selling_price} onChange={e=>setForm({...form, selling_price: e.target.value})} />
        <input type="number" placeholder="Cost Price" value={form.cost_price} onChange={e=>setForm({...form, cost_price: e.target.value})} />
        <button className="col-span-2 px-3 py-2 bg-green-600 text-white rounded">Add Product</button>
      </form>

      <div className="space-y-2">
        {items.map(it => (
          <div key={it.id} className="p-2 bg-white rounded shadow flex justify-between">
            <div>
              <div className="font-medium">{it.product_name}</div>
              <div className="text-sm">SKU: {it.sku} • Qty: {it.quantity}</div>
            </div>
            <div className="text-right">
              <div>₦{it.selling_price}</div>
              <div className="text-sm">{new Date(it.updated_at || it.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
