// src/hooks/useOfflineQueue.js
import { useEffect, useState } from 'react'
import { store } from '../lib/localStore'
import { startSyncWorker, queueOperation } from '../lib/offlineSync'

export function useSyncStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [queueLength, setQueueLength] = useState(0)

  useEffect(() => {
    const update = async () => {
      const q = (await store.getItem('sync_queue_v1')) || []
      setQueueLength(q.length)
    }
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    startSyncWorker()
    update()

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return { online, queueLength }
}

export { queueOperation }
