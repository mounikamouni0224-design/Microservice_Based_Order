import { Bell, Boxes, RefreshCw, ShoppingBag, Users } from 'lucide-react'
import DashboardCharts from './DashboardCharts.jsx'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from './Ui.jsx'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function Dashboard({ data, errors, loading, onRefresh, onNavigate }) {
  const totalInventory = data.products.reduce((sum, product) => sum + Math.max(0, Number(product.stock) || 0), 0)
  const orderVolume = data.orders.reduce((sum, order) => sum + Math.max(0, Number(order.quantity) || 0), 0)
  const revenue = data.orders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0)
  const activeCustomers = data.customers.length
  const notificationsSent = data.notifications.filter((item) => ['sent', 'delivered', 'success'].includes(String(item.status || '').toLowerCase())).length
  const dispatchRate = data.notifications.length ? Math.round((notificationsSent / data.notifications.length) * 100) : 0
  const latestOrders = [...data.orders].slice(-5).reverse()
  const customersById = new Map(data.customers.map((customer) => [String(customer.id), customer]))
  const productsById = new Map(data.products.map((product) => [String(product.id), product]))
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <div className="executive-dashboard">
      {Object.keys(errors).length > 0 && <div className="mb-5"><ErrorState message={`Unable to reach ${Object.keys(errors).join(', ')} service(s). The available dashboard data is shown below.`} onRetry={onRefresh} /></div>}

      <header className="executive-header">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1>Executive Summary (Podsumowanie)</h1>
          <span className="month-pill">{monthLabel}</span>
        </div>
        <div className="executive-header-actions">
          <div className="headline-stat"><span>REVENUE</span><strong>{currency.format(revenue)}</strong></div>
          <div className="headline-stat headline-stat-volume"><span>VOLUME</span><strong>{orderVolume.toLocaleString('en-US')} items</strong></div>
          <button className="icon-button refresh-button" onClick={onRefresh} title="Refresh service data" aria-label="Refresh service data">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Business metrics">
        <Metric icon={ShoppingBag} label="Total orders" value={data.orders.length} note={`${orderVolume.toLocaleString('en-US')} items processed`} tone="blue" onClick={() => onNavigate('orders')} loading={loading && !data.orders.length} error={errors.orders} />
        <Metric icon={Boxes} label="Catalog inventory" value={totalInventory.toLocaleString('en-US')} note={`Across ${data.products.length} active product SKUs`} tone="green" onClick={() => onNavigate('products')} loading={loading && !data.products.length} error={errors.products} />
        <Metric icon={Users} label="Active customers" value={activeCustomers} note="Verified accounts" tone="purple" onClick={() => onNavigate('customers')} loading={loading && !data.customers.length} error={errors.customers} />
        <Metric icon={Bell} label="Notifications sent" value={notificationsSent} note={`${dispatchRate}% dispatch success`} tone="amber" onClick={() => onNavigate('notifications')} loading={loading && !data.notifications.length} error={errors.notifications} />
      </section>

      <DashboardCharts products={data.products} orders={data.orders} notifications={data.notifications} loading={loading} errors={errors} onRefresh={onRefresh} />

      <section className="panel recent-orders-panel">
        <div className="recent-orders-heading">
          <div>
            <h2 className="section-title">Recent Orders (Real-time Service Feed)</h2>
            <p className="section-caption">The latest orders recorded by your services</p>
          </div>
          <button className="order-create-button" onClick={() => onNavigate('orders')}>+ Place New Order via REST Client</button>
        </div>
        {errors.orders ? <ErrorState message={errors.orders} onRetry={onRefresh} /> : loading && !data.orders.length ? <LoadingState /> : latestOrders.length ? (
          <div className="table-scroll"><table className="data-table recent-orders-table">
            <thead><tr><th>ORDER #</th><th>CUSTOMER</th><th>ITEMS</th><th>AMOUNT</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody>{latestOrders.map((order) => {
              const customer = customersById.get(String(order.customerId))
              const product = productsById.get(String(order.productId))
              return <tr key={order.id}>
                <td className="font-semibold text-slate-700">ORD-{String(order.id).padStart(6, '0').toUpperCase()}</td>
                <td>{customer?.name || `Customer #${order.customerId}`}</td>
                <td>{order.quantity} item{Number(order.quantity) === 1 ? '' : 's'}{product?.name ? ` · ${product.name}` : ''}</td>
                <td className="font-semibold text-slate-700">{order.totalPrice == null ? '—' : currency.format(order.totalPrice)}</td>
                <td><StatusBadge value={order.status} /></td>
                <td><button className="cancel-order-button" onClick={() => onNavigate('orders')}>View Order</button></td>
              </tr>
            })}</tbody>
          </table></div>
        ) : <EmptyState title="No orders to show" description="When orders are created, they’ll appear here." action="Go to orders" onAction={() => onNavigate('orders')} />}
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value, note, tone, onClick, loading, error }) {
  return (
    <button className="metric-card executive-metric" onClick={onClick}>
      <div className="flex w-full items-center justify-between">
        <span className="metric-label">{label}</span>
        <span className={`metric-icon metric-${tone}`}><Icon size={19} /></span>
      </div>
      <strong className="metric-value">{error ? '—' : loading ? '…' : value}</strong>
      <span className={`metric-note ${tone === 'green' || tone === 'purple' ? 'metric-note-accent' : ''}`}>{error ? 'Service unavailable' : note}</span>
    </button>
  )
}
