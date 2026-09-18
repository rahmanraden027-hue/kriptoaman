import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import RouteSeo from '@/lib/RouteSeo.jsx'
import AppErrorBoundary from '@/components/AppErrorBoundary.jsx'
import '@/index.css'
import '@/styles/production.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#020617;color:#fff;font-family:system-ui,sans-serif;padding:24px">
      <section style="max-width:520px;text-align:center">
        <h1 style="font-size:22px;margin:0 0 12px">KriptoAman</h1>
        <p style="color:#94a3b8;line-height:1.6">Aplikasi gagal menemukan root container. Muat ulang halaman untuk memulihkan tampilan.</p>
      </section>
    </main>`
} else {
  ReactDOM.createRoot(rootElement).render(
    <AppErrorBoundary>
      <RouteSeo />
      <App />
    </AppErrorBoundary>
  )
}
