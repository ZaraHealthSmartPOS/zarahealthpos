// src/lib/offlineSync.js
import { supabase } from './supabaseClient'
import { store, save, get, remove } from './localStore'
import { v4 as uuidv4 } from 'uuid'

const QUEUE_KEY = 'sync_queue_v1'
const SYNC_INTERVAL_MS = 10_000 // attempt every 10s when online

async function readQueue() {
  const q = (await get(QUEUE_KEY)) || []
  return q
}

async function writeQueue(queue) {
  await save(QUEUE_KEY, queue)
}

// push an operation onto local queue
export async function queueOperation(op) {
  const q = await readQueue()
  op.id = op.id || uuidv4()
  op.attempts = op.attempts || 0
  op.created_at = new Date().toISOString()
  q.push(op)
  await writeQueue(q)
  // If online, trigger immediate sync attempt
  if (navigator.onLine) {
    try {
      await syncQueueOnce()
    } catch (e) {
      // ignore — will retry later
      console.warn('Immediate sync attempt failed', e)
    }
  }
  return op.id
}

// process one operation (returns {ok:true} or throws)
async function processOp(op) {
  if (op.op_type === 'sale_create') {
    const payload = op.payload
    // Insert into sales and sale_items in a transaction-like way:
    // Supabase doesn't support multi-table transactions in single insert, but we can:
    // 1. insert into sales (returning id)
    // 2. insert into sale_items with sale_id
    const { data: saleData, error: saleErr } = await supabase
      .from('sales')
      .insert({
        invoice_no: payload.invoice_no,
        customer_name: payload.customer_name || null,
        total_amount: payload.total_amount,
        discounts: payload.discounts || 0,
        refunds: payload.refunds || 0,
        payment_method: payload.payment_method || 'unknown',
        employee_id: payload.employee_id || null,
        created_at: payload.created_at || new Date().toISOString(),
      })
      .select('id')
      .single()

    if (saleErr) throw saleErr

    const saleId = saleData.id

    // Prepare sale items
    const itemsToInsert = (payload.items || []).map((it) => ({
      sale_id: saleId,
      product_id: it.product_id || null,
      sku: it.sku || null,
      product_name: it.product_name,
      quantity: it.quantity,
      unit_cost: it.unit_cost,
      unit_price: it.unit_price,
      total: it.total,
    }))

    const { error: itemsErr } = await supabase.from('sale_items').insert(itemsToInsert)
    if (itemsErr) throw itemsErr

    // update inventory quantities (reduce stock)
    for (const it of (payload.items || [])) {
      if (!it.product_id) continue
      // update quantity subtracting sold amount
      const { error: invErr } = await supabase
        .from('inventory')
        .update({
          quantity: supabase.rpc ? undefined : null, // placeholder, see below
          updated_at: new Date().toISOString(),
        })
        .eq('id', it.product_id)
      // safer approach: use RPC or fetch current value then update subtracting
      if (invErr) {
        // fallback: ignore inventory update for now (we still created sale)
        console.warn('Inventory update error', invErr)
      } else {
        // We'll apply precise decrement via RPC or by fetching current quantity then update:
        // Implemented below in separate function if needed.
      }
    }

    return { ok: true, saleId }
  } else if (op.op_type === 'inventory_update') {
    const payload = op.payload
    const { error } = await supabase.from('inventory').upsert(payload)
    if (error) throw error
    return { ok: true }
  } else {
    throw new Error('Unknown op_type ' + op.op_type)
  }
}

// helper to decrement inventory via read-modify-write
async function decrementInventory(productId, qty) {
  const { data, error } = await supabase.from('inventory').select('quantity').eq('id', productId).single()
  if (error) throw error
  const newQty = Math.max(0, (data.quantity || 0) - qty)
  const { error: updErr } = await supabase.from('inventory').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', productId)
  if (updErr) throw updErr
  return true
}

// attempt to sync queue once (process items sequentially)
export async function syncQueueOnce() {
  const queue = await readQueue()
  if (!queue.length) return { processed: 0 }

  // clone to process
  const remaining = []
  let processed = 0

  for (const op of queue) {
    try {
      if (op.op_type === 'sale_create') {
        const payload = op.payload
        // Insert sale header
        const { data: saleData, error: saleErr } = await supabase
          .from('sales')
          .insert({
            invoice_no: payload.invoice_no,
            customer_name: payload.customer_name || null,
            total_amount: payload.total_amount,
            discounts: payload.discounts || 0,
            refunds: payload.refunds || 0,
            payment_method: payload.payment_method || 'unknown',
            employee_id: payload.employee_id || null,
            created_at: payload.created_at || new Date().toISOString(),
          })
          .select('id')
          .single()

        if (saleErr) throw saleErr
        const saleId = saleData.id

        // insert items
        const itemsToInsert = (payload.items || []).map((it) => ({
          sale_id: saleId,
          product_id: it.product_id || null,
          sku: it.sku || null,
          product_name: it.product_name,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
          unit_price: it.unit_price,
          total: it.total,
        }))

        const { error: itemsErr } = await supabase.from('sale_items').insert(itemsToInsert)
        if (itemsErr) throw itemsErr

        // decrement inventory per item
        for (const it of (payload.items || [])) {
          if (!it.product_id) continue
          try {
            await decrementInventory(it.product_id, it.quantity)
          } catch (e) {
            console.warn('inventory decrement failed', e)
            // don't fail entire sale for inventory decrement; continue
          }
        }

        processed += 1
      } else if (op.op_type === 'inventory_update') {
        const payload = op.payload
        const { error } = await supabase.from('inventory').upsert(payload)
        if (error) throw error
        processed += 1
      } else {
        // unknown op, skip
        remaining.push(op)
      }
    } catch (err) {
      // increment attempt and requeue with backoff
      op.attempts = (op.attempts || 0) + 1
      if (op.attempts < 5) {
        // keep for retry
        remaining.push(op)
      } else {
        // if too many attempts, log and drop (or move to dead-letter queue)
        console.error('Dropping op after too many attempts', op, err)
      }
    }
  }

  await writeQueue(remaining)
  return { processed }
}

// background sync runner
let syncIntervalId = null
export function startSyncWorker() {
  if (syncIntervalId) return
  // try immediately
  const trySync = async () => {
    if (!navigator.onLine) return
    try {
      const res = await syncQueueOnce()
      if (res && res.processed) {
        console.log('Synced items:', res.processed)
      }
    } catch (e) {
      console.warn('Sync attempt failed', e)
    }
  }

  window.addEventListener('online', trySync)
  // periodic try
  syncIntervalId = setInterval(trySync, SYNC_INTERVAL_MS)
  // try on start
  trySync()
}

export function stopSyncWorker() {
  if (!syncIntervalId) return
  clearInterval(syncIntervalId)
  syncIntervalId = null
  window.removeEventListener('online', syncQueueOnce)
}
