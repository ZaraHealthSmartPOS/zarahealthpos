// src/pages/Checkout.jsx
import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { queueOperation } from '../lib/offlineSync'
import { useSyncStatus } from '../hooks/useOfflineQueue'
import dayjs from 'dayjs'

export default function Checkout({ currentEmployee }) {
  const [items, setItems] = useState([]) // [{product_id, sku, product_name, quantity, unit_price, unit_cost}]
  const [customer, setCustomer] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const { online, queueLength } = useSyncStatus()

  const addItem = (product) => {
    const existing = items.find((i) => i.sku === product.sku)
    if (existing) {
      setItems(items.map(i => i.sku === product.sku ? { ...i, quantity: i.quantity + 1, total: (i.quantity+1) * i.unit_price } : i))
    } else {
      setItems([...items, { ...product, quantity: 1, total: product.unit_price }])
    }
  }

  const removeItem = (sku) => setItems(items.filter(i => i.sku !== sku))

  const computeTotal = () => items.reduce((s, x) => s + (Number(x.total) || 0), 0)

  const handleCompleteSale = async () => {
    if (!items.length) return alert('Add items')
    const invoiceNo = `INV-${dayjs().format('YYYYMMDDHHmmss')}-${Math.floor(Math.random()*9000)+1000}`
    const payload = {
      invoice_no: invoiceNo,
      customer_name: customer || null,
      total_amount: computeTotal(),
      discounts: 0,
      refunds: 0,
      payment_method: paymentMethod,
      employee_id: currentEmployee?.id || null,
      created_at: new Date().toISOString(),
      items: items.map(i => ({
        product_id: i.product_id || null,
        sku: i.sku,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_cost: i.unit_cost || 0,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price
      }))
    }

    await queueOperation({ op_type: 'sale_create', payload })
    setItems([])
    setCustomer('')
    alert(`Sale queued (invoice ${invoiceNo}). ${online ? 'Attempting to sync now.' : 'Will sync when online.'}`)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Checkout</h2>
        <div>
          <span className={`px-2 py-1 rounded ${online ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
          <span className="ml-3 text-sm">Queue: {queueLength}</span>
        </div>
      </div>

      <div className="mb-4">
        <label>Customer name</label>
        <input value={customer} onChange={e=>setCustomer(e.target.value)} className="border p-2 w-full" />
      </div>

      <div className="mb-4">
        <label>Items</label>
        <div className="space-y-2">
          {items.map(it => (
            <div key={it.sku} className="flex justify-between bg-white p-2 rounded shadow">
              <div>
                <div className="font-medium">{it.product_name}</div>
                <div className="text-sm">Qty: {it.quantity} × ₦{it.unit_price}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-semibold">₦{it.total}</div>
                <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => removeItem(it.sku)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-lg font-bold">Total: ₦{computeTotal()}</div>
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleCompleteSale}>Complete Sale</button>
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => { setItems([]); setCustomer('') }}>Cancel</button>
      </div>
    </div>
  )
}
