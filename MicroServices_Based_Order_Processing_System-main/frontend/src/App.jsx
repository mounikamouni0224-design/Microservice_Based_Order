import { useState } from 'react'
import { Activity, Bell, CalendarDays, RefreshCw } from 'lucide-react'
import Customers from './components/Customers.jsx'
import Dashboard from './components/Dashboard.jsx'
import Notifications from './components/Notifications.jsx'
import Orders from './components/Orders.jsx'
import Products from './components/Products.jsx'
import Sidebar from './components/Sidebar.jsx'
import { Toast } from './components/Ui.jsx'
import useWorkspaceData from './hooks/useWorkspaceData.js'

const pageTitles = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  products: 'Products',
  orders: 'Orders',
  notifications: 'Notifications',
}

export default function App() {
  const { data, errors, loading, refresh } = useWorkspaceData()
  const [activeView, setActiveView] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const notify = (notice) => {
    setToast(notice)
    window.setTimeout(() => setToast(null), 4000)
  }
  const onNavigate = (view) => {
    setActiveView(view)
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Sidebar
        activeView={activeView}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onMobileToggle={setMobileOpen}
        errors={errors}
        counts={{
          customers: data.customers.length,
          products: data.products.length,
          orders: data.orders.length,
          notifications: data.notifications.length,
        }}
      />
      <main className="main-area">
        {activeView !== 'dashboard' && <header className="topbar">
          <div className="flex items-center gap-2 text-xs text-slate-400"><span>Workspace</span><span>/</span><strong className="font-semibold text-slate-700">{pageTitles[activeView]}</strong></div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex"><CalendarDays size={14} />{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
            <span className="hidden h-5 border-l border-slate-200 sm:block" />
            <button className="icon-button" onClick={refresh} title="Refresh service data" aria-label="Refresh service data"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
            <button className="icon-button relative" onClick={() => onNavigate('notifications')} aria-label="View notifications"><Bell size={17} />{data.notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />}</button>
          </div>
        </header>}
        <div className={`page-container ${activeView === 'dashboard' ? 'dashboard-page-container' : ''}`}>
          {activeView === 'dashboard' && <Dashboard data={data} errors={errors} loading={loading} onRefresh={refresh} onNavigate={onNavigate} />}
          {activeView === 'customers' && <Customers customers={data.customers} error={errors.customers} loading={loading} onRefresh={refresh} onChanged={refresh} onToast={notify} />}
          {activeView === 'products' && <Products products={data.products} error={errors.products} loading={loading} onRefresh={refresh} onChanged={refresh} onToast={notify} />}
          {activeView === 'orders' && <Orders customers={data.customers} products={data.products} orders={data.orders} errors={errors} loading={loading} onRefresh={refresh} onChanged={refresh} onToast={notify} />}
          {activeView === 'notifications' && <Notifications notifications={data.notifications} error={errors.notifications} loading={loading} onRefresh={refresh} />}
          <footer className="mt-8 flex items-center justify-between gap-3 pb-2 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1.5"><Activity size={13} className={Object.keys(errors).length ? 'text-amber-500' : 'text-emerald-500'} />{Object.keys(errors).length ? `${Object.keys(errors).length} service(s) need attention` : 'Workspace data is up to date'}</span>
            <span>Orderflow <span className="mx-1 text-slate-300">·</span> Operations made clearer</span>
          </footer>
        </div>
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
