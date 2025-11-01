// src/main.jsx (example)
import { testWrite } from './lib/testSupabase';
testWrite();

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { startSyncWorker } from './lib/offlineSync'
import './index.css'

startSyncWorker()

createRoot(document.getElementById('root')).render(<App />)
