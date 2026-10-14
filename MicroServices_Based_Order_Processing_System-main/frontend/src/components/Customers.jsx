import { useMemo, useState } from 'react'
import { Mail, MapPin, Phone, Trash2, UserPlus, Users } from 'lucide-react'
import { api, getApiError } from '../services/api.js'
import { EmptyState, ErrorState, LoadingState, Modal, PageHeading, Pagination, SearchBox } from './Ui.jsx'

export default function Customers({ customers, error, loading, onRefresh, onChanged, onToast }) {
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const filtered = useMemo(() => customers.filter((customer) => [customer.name, customer.email, customer.phone, customer.address].join(' ').toLowerCase().includes(search.toLowerCase())), [customers, search])

  return (
    <div>
      <PageHeading eyebrow="CUSTOMER DIRECTORY" title="Customers" description="Manage customer details and keep your customer list up to date." action="Add customer" onAction={() => setAddOpen(true)} />
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Users size={16} className="text-indigo-500" />{customers.length} customers</div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search customers..." />
        </div>
        {error ? <ErrorState message={error} onRetry={onRefresh} /> : loading && !customers.length ? <LoadingState label="Loading customers..." /> : filtered.length ? (
          <>
            <div className="table-scroll"><table className="data-table">
              <thead><tr><th>CUSTOMER</th><th>EMAIL</th><th>PHONE</th><th>ADDRESS</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{filtered.map((customer) => <tr key={customer.id}>
                <td><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">{initials(customer.name)}</span><span><strong className="block text-xs font-semibold text-slate-700">{customer.name}</strong><small className="mt-1 block text-[10px] text-slate-400">Customer #{customer.id}</small></span></div></td>
                <td><a className="table-link" href={`mailto:${customer.email}`}><Mail size={14} />{customer.email}</a></td>
                <td className="text-slate-600">{customer.phone ? <span className="inline-flex items-center gap-2"><Phone size={13} className="text-slate-400" />{customer.phone}</span> : '—'}</td>
                <td className="max-w-52 truncate text-slate-600">{customer.address ? <span className="inline-flex items-center gap-2"><MapPin size={13} className="text-slate-400" />{customer.address}</span> : '—'}</td>
                <td><button className="danger-icon-button" aria-label={`Delete ${customer.name}`} onClick={() => deleteCustomer(customer, onChanged, onToast)}><Trash2 size={15} /></button></td>
              </tr>)}</tbody>
            </table></div>
            <Pagination count={filtered.length} />
          </>
        ) : <EmptyState title={search ? 'No matching customers' : 'No customers yet'} description={search ? 'Try a different name, email, or phone number.' : 'Add a customer to get started with your directory.'} action={!search && 'Add customer'} onAction={() => setAddOpen(true)} />}
      </section>
      {addOpen && <CustomerModal onClose={() => setAddOpen(false)} saving={saving} onSubmit={async (record) => {
        setSaving(true)
        try {
          await api.customers.create(record)
          setAddOpen(false)
          onToast({ message: 'Customer added successfully.' })
          onChanged()
        } catch (saveError) {
          onToast({ message: getApiError(saveError), type: 'error' })
        } finally {
          setSaving(false)
        }
      }} />}
    </div>
  )
}

function CustomerModal({ onClose, onSubmit, saving }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return setError('Enter the customer’s name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.')
    setError('')
    await onSubmit({ ...form, name: form.name.trim(), email: form.email.trim() })
  }

  return <Modal title="Add customer" description="Add a customer to your order directory." onClose={onClose}>
    <form className="space-y-4 px-6 py-5" onSubmit={submit}>
      <Field label="Full name" required><input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Taylor Morgan" maxLength="255" required /></Field>
      <Field label="Email address" required><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="taylor@example.com" maxLength="255" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Phone"><input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+1 (555) 010-1234" maxLength="255" /></Field><Field label="Address"><input value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="City, country" maxLength="255" /></Field></div>
      {error && <p className="text-xs text-rose-600" role="alert">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button-primary" disabled={saving}>{saving ? 'Saving...' : <><UserPlus size={15} /> Add customer</>}</button></div>
    </form>
  </Modal>
}

function Field({ label, required, children }) {
  return <label className="form-field"><span>{label}{required && <i> *</i>}</span>{children}</label>
}

async function deleteCustomer(customer, onChanged, onToast) {
  if (!window.confirm(`Delete ${customer.name}? This action cannot be undone.`)) return
  try {
    await api.customers.remove(customer.id)
    onToast({ message: 'Customer deleted.' })
    onChanged()
  } catch (error) {
    onToast({ message: getApiError(error), type: 'error' })
  }
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
}
