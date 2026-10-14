import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Package, ShoppingCart } from 'lucide-react'
import { api, getApiError } from '../services/api.js'
import { EmptyState, ErrorState, LoadingState, PageHeading, SearchBox, StatusBadge } from './Ui.jsx'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function Orders({ customers, products, orders, errors, loading, onRefresh, onChanged, onToast }) {
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const selectedProduct = products.find((item) => String(item.id) === String(productId))
  const total = Number(selectedProduct?.price || 0) * (Number(quantity) || 0)
  const filteredOrders = useMemo(() => orders.filter((order) => [order.id, order.status, order.customerId, order.productId].join(' ').toLowerCase().includes(search.toLowerCase())), [orders, search])
  const canSubmit = Boolean(customerId && productId && Number.isInteger(Number(quantity)) && Number(quantity) > 0 && !saving)

  const submit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    try {
      await api.orders.create({
        customerId: Number(customerId),
        productId: Number(productId),
        quantity: Number(quantity),
        totalPrice: Number(total.toFixed(2)),
        status: 'Pending',
      })
      setCustomerId('')
      setProductId('')
      setQuantity('1')
      onToast({ message: 'Order placed successfully.' })
      onChanged()
    } catch (error) {
      onToast({ message: getApiError(error), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeading eyebrow="ORDER PROCESSING" title="Orders" description="Create an order and follow its status through the system." />
      {Object.keys(errors).length > 0 && <div className="mb-5"><ErrorState message={`Could not load ${Object.keys(errors).join(', ')}. Check service availability before placing an order.`} onRetry={onRefresh} /></div>}

      <div className="mb-5 grid gap-4 xl:grid-cols-[.86fr_1.4fr]">
        <section className="panel self-start">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><ShoppingCart size={17} /></span><div><h2 className="section-title">New order</h2><p className="section-caption">Choose a customer and product</p></div></div>
          {errors.customers || errors.products || errors.orders ? <ErrorState message={errors.customers || errors.products || errors.orders} onRetry={onRefresh} /> : loading && (!customers.length || !products.length) ? <LoadingState label="Loading customers and products..." /> : (
            <form className="space-y-4 p-5" onSubmit={submit}>
              {!customers.length && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">Add a customer before placing an order.</p>}
              {!products.length && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">Add a product before placing an order.</p>}
              <Field label="Customer" required><select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required><option value="">Select a customer</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.email}</option>)}</select></Field>
              <Field label="Product" required><select value={productId} onChange={(event) => setProductId(event.target.value)} required><option value="">Select a product</option>{products.map((product) => <option value={product.id} key={product.id} disabled={Number(product.stock) <= 0}>{product.name} · {currency.format(product.price)} · {product.stock} in stock</option>)}</select></Field>
              <Field label="Quantity" required><input type="number" min="1" step="1" max={selectedProduct?.stock || undefined} value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></Field>
              {selectedProduct && Number(quantity) > Number(selectedProduct.stock) && <p className="-mt-2 text-[11px] text-rose-600">Quantity exceeds available stock ({selectedProduct.stock}).</p>}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between text-xs text-slate-500"><span>Order total</span><span>{currency.format(Number(selectedProduct?.price || 0))} × {Number(quantity) || 0}</span></div><div className="mt-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">Total</span><strong className="text-xl font-semibold tracking-tight text-slate-900">{currency.format(total)}</strong></div></div>
              <button className="button-primary w-full" type="submit" disabled={!canSubmit || Number(quantity) > Number(selectedProduct?.stock || 0)}>{saving ? 'Placing order...' : <><CheckCircle2 size={16} /> Place order</>}</button>
            </form>
          )}
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><ClipboardList size={17} /></span><div><h2 className="section-title">Order history</h2><p className="section-caption">Orders recorded by the service</p></div></div><SearchBox value={search} onChange={setSearch} placeholder="Search orders..." /></div>
          {errors.orders ? <ErrorState message={errors.orders} onRetry={onRefresh} /> : loading && !orders.length ? <LoadingState label="Loading orders..." /> : filteredOrders.length ? (
            <div className="table-scroll"><table className="data-table">
              <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>PRODUCT</th><th>QTY</th><th>TOTAL</th><th>STATUS</th></tr></thead>
              <tbody>{[...filteredOrders].reverse().map((order) => <tr key={order.id}><td className="font-semibold text-indigo-600">#{order.id}</td><td>Customer #{order.customerId}</td><td>Product #{order.productId}</td><td>{order.quantity}</td><td className="font-medium text-slate-700">{order.totalPrice == null ? '—' : currency.format(order.totalPrice)}</td><td><StatusBadge value={order.status} /></td></tr>)}</tbody>
            </table></div>
          ) : <EmptyState title={search ? 'No matching orders' : 'No orders yet'} description={search ? 'Try searching by order number or status.' : 'Create an order using the form to start your order history.'} />}
        </section>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Total orders" value={orders.length} icon={ClipboardList} />
        <SummaryTile label="Pending orders" value={orders.filter((order) => String(order.status).toLowerCase() === 'pending').length} icon={ShoppingCart} />
        <SummaryTile label="Catalog products" value={products.length} icon={Package} />
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return <label className="form-field"><span>{label}{required && <i> *</i>}</span>{children}</label>
}

function SummaryTile({ label, value, icon: Icon }) {
  return <div className="panel flex items-center gap-3 p-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon size={17} /></span><span><span className="block text-[10px] text-slate-500">{label}</span><strong className="mt-1 block text-lg font-semibold text-slate-800">{value}</strong></span></div>
}
