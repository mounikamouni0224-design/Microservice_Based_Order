import { useMemo } from 'react'
import { Bell, Package, PieChart, ShoppingCart } from 'lucide-react'
import { ErrorState, LoadingState } from './Ui.jsx'

const numberFormat = new Intl.NumberFormat('en-US')
const orderColors = {
  completed: '#39a983',
  complete: '#39a983',
  delivered: '#df7059',
  shipped: '#39a983',
  confirmed: '#8959e9',
  processing: '#4d8bee',
  pending: '#f0a000',
  failed: '#e25454',
  cancelled: '#e25454',
}
const palette = ['#df7059', '#39a983', '#4385eb', '#efa000', '#8959e9', '#23a6b2']

export default function DashboardCharts({ products, orders, notifications, loading, errors, onRefresh }) {
  const inventory = useMemo(
    () => products.map((product, index) => ({
      label: product.name || `Product #${product.id}`,
      value: Math.max(0, Number(product.stock) || 0),
      color: palette[index % palette.length],
    })).filter((product) => product.value > 0),
    [products],
  )
  const statuses = useMemo(() => {
    const counts = new Map()
    orders.forEach((order) => {
      const label = String(order.status || 'Unknown').trim() || 'Unknown'
      counts.set(label, (counts.get(label) || 0) + 1)
    })
    return [...counts.entries()].map(([label, value], index) => ({
      label,
      value,
      color: orderColors[label.toLowerCase()] || palette[index % palette.length],
    })).sort((a, b) => b.value - a.value)
  }, [orders])
  const totalInventory = inventory.reduce((sum, product) => sum + product.value, 0)
  const latestOrders = orders.slice(-12)
  const notificationsSent = notifications.filter((item) => ['sent', 'delivered', 'success'].includes(String(item.status || '').toLowerCase())).length

  return (
    <section className="dashboard-analytics" aria-label="Business analytics">
      <article className="panel order-trend-panel">
        <div className="trend-heading">
          <div>
            <h2 className="section-title">(Order Volume &amp; Revenue Trends)</h2>
            <p className="section-caption">Order quantity and revenue from the latest service records</p>
          </div>
          <div className="trend-legend">
            <span><i className="legend-coral" />Orders / Volume</span>
            <span><i className="legend-green" />Revenue ($)</span>
          </div>
        </div>
        {errors.orders ? <ErrorState message={errors.orders} onRetry={onRefresh} /> : loading && !orders.length ? <LoadingState label="Loading order trends..." /> : latestOrders.length ? (
          <OrderTrendChart orders={latestOrders} />
        ) : (
          <div className="trend-empty"><ShoppingCart size={20} /><span>Order trends will appear after the first order is recorded.</span></div>
        )}
      </article>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <DistributionCard
          title="(Product Inventory Share)"
          icon={Package}
          items={inventory}
          total={totalInventory}
          unavailable={Boolean(errors.products)}
          error={errors.products}
          loading={loading && !products.length}
          emptyTitle="No inventory to summarize"
          emptyDescription="Add products with available stock to see the inventory distribution."
          emptyIcon={Package}
          formatValue={(value) => numberFormat.format(value)}
          centerLabel="units"
        />
        <DistributionCard
          title="(Order Status Distribution)"
          icon={PieChart}
          items={statuses}
          total={orders.length}
          unavailable={Boolean(errors.orders)}
          error={errors.orders}
          loading={loading && !orders.length}
          emptyTitle="No orders to summarize"
          emptyDescription="Order status distribution will appear after your first order."
          emptyIcon={ShoppingCart}
          formatValue={(value) => numberFormat.format(value)}
          centerLabel="orders"
          footer={notifications.length ? `${notificationsSent} of ${notifications.length} notifications successfully delivered` : ''}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  )
}

function OrderTrendChart({ orders }) {
  const maxQuantity = Math.max(...orders.map((order) => Math.max(0, Number(order.quantity) || 0)), 1)
  const maxRevenue = Math.max(...orders.map((order) => Math.max(0, Number(order.totalPrice) || 0)), 1)
  return (
    <div className="order-trend-chart" role="img" aria-label="Bar chart of quantity and revenue by recent order">
      {orders.map((order) => {
        const quantity = Math.max(0, Number(order.quantity) || 0)
        const revenue = Math.max(0, Number(order.totalPrice) || 0)
        return (
          <div className="trend-column" key={order.id} title={`Order #${order.id}: ${quantity} item(s), $${revenue.toFixed(2)}`}>
            <div className="trend-bars">
              <span className="trend-bar trend-bar-orders" style={{ height: `${Math.max(6, quantity / maxQuantity * 100)}%` }} />
              <span className="trend-bar trend-bar-revenue" style={{ height: `${Math.max(6, revenue / maxRevenue * 100)}%` }} />
            </div>
            <span className="trend-label">#{order.id}</span>
          </div>
        )
      })}
    </div>
  )
}

function DistributionCard({
  title,
  icon: Icon,
  items,
  total,
  unavailable,
  error,
  loading,
  emptyTitle,
  emptyDescription,
  emptyIcon: EmptyIcon,
  formatValue,
  centerLabel,
  footer = '',
  onRefresh,
}) {
  return (
    <article className="panel distribution-card">
      <div className="distribution-heading">
        <div className="flex min-w-0 items-center gap-3">
          <span className="distribution-title-icon"><Icon size={18} /></span>
          <h2 className="section-title">{title}</h2>
        </div>
      </div>
      {unavailable ? (
        <div className="distribution-message"><ErrorState message={error} onRetry={onRefresh} /></div>
      ) : loading ? (
        <LoadingState />
      ) : items.length ? (
        <div className="distribution-content">
          <div className="distribution-donut-wrap">
            <Donut items={items} total={total} />
            <div className="distribution-donut-center">
              <strong>{formatValue(total)}</strong>
              <span>{centerLabel}</span>
            </div>
          </div>
          <div className="distribution-legend">
            {items.map((item) => (
              <div className="distribution-legend-row" key={item.label}>
                <span className="distribution-legend-label"><i style={{ background: item.color }} />{item.label}</span>
                <strong>{formatValue(item.value)}</strong>
              </div>
            ))}
            {footer && <p className="distribution-footnote"><Bell size={12} />{footer}</p>}
          </div>
        </div>
      ) : (
        <div className="distribution-empty"><EmptyIcon size={20} /><strong>{emptyTitle}</strong><p>{emptyDescription}</p></div>
      )}
    </article>
  )
}

function Donut({ items, total }) {
  const radius = 43
  const circumference = 2 * Math.PI * radius
  let offset = 0
  return (
    <svg className="distribution-donut" viewBox="0 0 112 112" role="img" aria-label={`Distribution of ${total} records`}>
      <circle cx="56" cy="56" r={radius} fill="none" stroke="#edf1ef" strokeWidth="15" />
      {items.map((item) => {
        const segmentLength = total ? item.value / total * circumference : 0
        const currentOffset = offset
        offset += segmentLength
        return <circle key={item.label} cx="56" cy="56" r={radius} fill="none" stroke={item.color} strokeWidth="15" strokeDasharray={`${segmentLength} ${circumference - segmentLength}`} strokeDashoffset={-currentOffset} transform="rotate(-90 56 56)" strokeLinecap={items.length === 1 ? 'butt' : 'round'} />
      })}
    </svg>
  )
}
