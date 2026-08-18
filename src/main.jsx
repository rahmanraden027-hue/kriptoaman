import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import RouteSeo from '@/lib/RouteSeo.jsx'
import '@/index.css'
import '@/styles/workspace-polish.css'
import '@/styles/admin-suite.css'
import '@/styles/final-ui-2026.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <RouteSeo />
    <App />
  </>
)
