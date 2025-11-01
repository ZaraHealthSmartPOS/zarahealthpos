// src/lib/localStore.js
import localforage from 'localforage'

localforage.config({
  name: 'zarahealthpos',
  storeName: 'zara_pos_store',
})

export const store = localforage

// convenience helpers
export const save = (key, value) => store.setItem(key, value)
export const get = (key) => store.getItem(key)
export const remove = (key) => store.removeItem(key)
export const keys = () => store.keys()
