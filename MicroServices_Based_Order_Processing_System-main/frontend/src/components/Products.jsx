import { useMemo, useState } from 'react'
import { Boxes, PackagePlus, Pencil, Trash2 } from 'lucide-react'
import { api, getApiError } from '../services/api.js'
import { EmptyState, ErrorState, LoadingState, Modal, PageHeading, Pagination, SearchBox } from './Ui.jsx'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function Products({ products, error, loading, onRefresh, onChanged, onToast }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const filtered = useMemo(() => products.filter((product) => {
    const matchesText = [product.name, product.id, product.price, product.stock].join(' ').toLowerCase().includes(search.toLowerCase())
    const stock = Number(product.stock) || 0
    const matchesFilter = filter === 'All' || (filter === 'In stock' && stock > 10) || (filter === 'Low stock' && stock > 0 && stock <= 10) || (filter === 'Out of stock' && stock === 0)
    return matchesText && matchesFilter
  }), [products, search, filter])

  return (
    <div>
      <PageHeading eyebrow="CATALOG & INVENTORY" title="Products" description="Manage your catalog, pricing, and stock levels." action="Add product" onAction={() => setModal({})} />
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Boxes size={16} className="text-indigo-500" />{products.length} products <span className="ml-2 text-[10px] font-normal text-amber-600">{products.filter((product) => Number(product.stock) <= 10).length} low stock</span></div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search products..." />
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-2.5 sm:px-5">
          {['All', 'In stock', 'Low stock', 'Out of stock'].map((item) => <button key={item} className={`filter-pill ${filter === item ? 'filter-pill-active' : ''}`} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
        {error ? <ErrorState message={error} onRetry={onRefresh} /> : loading && !products.length ? <LoadingState label="Loading products..." /> : filtered.length ? (
          <>
            <div className="table-scroll"><table className="data-table">
              <thead><tr><th>PRODUCT</th><th>UNIT PRICE</th><th>STOCK</th><th>STOCK STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{filtered.map((product) => <tr key={product.id}>
                <td><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-600"><Boxes size={17} /></span><span><strong className="block text-xs font-semibold text-slate-700">{product.name}</strong><small className="mt-1 block text-[10px] text-slate-400">Product #{product.id}</small></span></div></td>
                <td className="font-semibold text-slate-700">{currency.format(Number(product.price) || 0)}</td>
                <td className="font-medium text-slate-700">{product.stock} units</td>
                <td><StockStatus stock={product.stock} /></td>
                <td><div className="flex justify-end gap-1"><button className="icon-button" aria-label={`Update ${product.name} stock`} title="Edit product" onClick={() => setModal({ product })}><Pencil size={14} /></button><button className="danger-icon-button" aria-label={`Delete ${product.name}`} onClick={() => deleteProduct(product, onChanged, onToast)}><Trash2 size={15} /></button></div></td>
              </tr>)}</tbody>
            </table></div>
            <Pagination count={filtered.length} />
          </>
        ) : <EmptyState title={search || filter !== 'All' ? 'No matching products' : 'Your catalog is empty'} description={search || filter !== 'All' ? 'Try another search or stock filter.' : 'Add your first product to start tracking inventory.'} action={search || filter !== 'All' ? null : 'Add product'} onAction={() => setModal({})} />}
      </section>
      {modal && <ProductModal product={modal.product} onClose={() => setModal(null)} onSaved={() => { setModal(null); onChanged() }} onToast={onToast} />}
    </div>
  )
}

function ProductModal({ product, onClose, onSaved, onToast }) {
  const [form, setForm] = useState({ name: product?.name || '', price: product?.price ?? '', stock: product?.stock ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return setError('Enter a product name.')
    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) return setError('Enter a valid price.')
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) return setError('Stock must be a whole number of zero or more.')
    setSaving(true)
    setError('')
    const payload = { name: form.name.trim(), price: Number(form.price), stock: Number(form.stock) }
    try {
      if (product) await api.products.update(product.id, payload)
      else await api.products.create(payload)
      onToast({ message: product ? 'Product updated.' : 'Product added.' })
      onSaved()
    } catch (saveError) {
      setError(getApiError(saveError))
    } finally {
      setSaving(false)
    }
  }

  return <Modal title={product ? 'Update product' : 'Add product'} description={product ? 'Update product details or adjust stock levels.' : 'Add a product to your catalog.'} onClose={onClose}>
    <form className="space-y-4 px-6 py-5" onSubmit={submit}>
      <Field label="Product name" required><input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} maxLength="255" placeholder="e.g. Everyday tote bag" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Unit price" required><div className="relative"><span className="absolute left-3 top-2.5 text-xs text-slate-400">$</span><input className="pl-7" type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} placeholder="0.00" required /></div></Field><Field label="Stock quantity" required><input type="number" min="0" step="1" value={form.stock} onChange={(event) => update('stock', event.target.value)} placeholder="0" required /></Field></div>
      {error && <p className="text-xs text-rose-600" role="alert">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button-primary" disabled={saving}>{saving ? 'Saving...' : <><PackagePlus size={15} />{product ? 'Save changes' : 'Add product'}</>}</button></div>
    </form>
  </Modal>
}

function Field({ label, required, children }) {
  return <label className="form-field"><span>{label}{required && <i> *</i>}</span>{children}</label>
}

function StockStatus({ stock }) {
  const amount = Number(stock) || 0
  if (amount === 0) return <span className="status-badge badge-rose"><span />Out of stock</span>
  if (amount <= 10) return <span className="status-badge badge-amber"><span />Low stock</span>
  return <span className="status-badge badge-green"><span />In stock</span>
}

async function deleteProduct(product, onChanged, onToast) {
  if (!window.confirm(`Delete ${product.name}? This action cannot be undone.`)) return
  try {
    await api.products.remove(product.id)
    onToast({ message: 'Product deleted.' })
    onChanged()
  } catch (error) {
    onToast({ message: getApiError(error), type: 'error' })
  }
}
