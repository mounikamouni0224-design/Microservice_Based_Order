import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Plus, RefreshCw, Search } from 'lucide-react'

export function PageHeading({ eyebrow, title, description, action, onAction }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2.5 text-[10px] font-bold tracking-[.17em] text-indigo-600">{eyebrow}</p>}
        <h1 className="text-[28px] font-bold tracking-[-.035em] text-slate-900 sm:text-[30px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">{description}</p>}
      </div>
      {action && <button className="button-primary" onClick={onAction}><Plus size={17} />{action}</button>}
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return (
    <label className="flex h-10 min-w-48 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
      <Search size={16} />
      <input className="w-full border-0 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

export function LoadingState({ label = 'Loading data...' }) {
  return <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin text-indigo-500" size={24} /><span>{label}</span></div>
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="m-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
      <div className="min-w-0 flex-1"><strong className="text-sm font-semibold text-rose-800">Service unavailable</strong><p className="mt-1 break-words text-xs leading-5 text-rose-700">{message}</p></div>
      <button className="button-secondary shrink-0" onClick={onRetry}><RefreshCw size={14} /> Retry</button>
    </div>
  )
}

export function EmptyState({ title, description, action, onAction }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-5 py-9 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-indigo-100 bg-indigo-50/80 text-indigo-500"><CheckCircle2 size={21} /></span>
      <strong className="mt-4 text-sm font-semibold text-slate-700">{title}</strong>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
      {action && <button className="button-secondary mt-4" onClick={onAction}><Plus size={15} />{action}</button>}
    </div>
  )
}

export function Modal({ title, description, onClose, children, size = 'max-w-lg' }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card ${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 id="modal-title" className="text-base font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </div>
        {children}
      </section>
    </div>
  )
}

export function Toast({ toast, onDismiss }) {
  if (!toast) return null
  const success = toast.type !== 'error'
  return (
    <div className={`toast ${success ? 'toast-success' : 'toast-error'}`} role="status">
      {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{toast.message}</span>
      <button className="ml-2 opacity-70 hover:opacity-100" aria-label="Dismiss notification" onClick={onDismiss}>×</button>
    </div>
  )
}

export function StatusBadge({ value }) {
  const status = String(value || 'Unknown')
  const normalized = status.toLowerCase()
  const color = ['completed', 'complete', 'delivered', 'sent', 'success'].includes(normalized) ? 'badge-green'
    : ['processing', 'shipped'].includes(normalized) ? 'badge-indigo'
      : ['pending'].includes(normalized) ? 'badge-amber'
        : ['failed', 'cancelled', 'error'].includes(normalized) ? 'badge-rose' : 'badge-slate'
  return <span className={`status-badge ${color}`}><span />{status}</span>
}

export function Pagination({ count }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
      <span>{count} {count === 1 ? 'record' : 'records'}</span>
      <div className="flex items-center gap-1"><button className="pagination-button" disabled aria-label="Previous page"><ChevronLeft size={15} /></button><span className="grid h-7 w-7 place-items-center rounded-md bg-indigo-50 font-semibold text-indigo-600">1</span><button className="pagination-button" disabled aria-label="Next page"><ChevronRight size={15} /></button></div>
    </div>
  )
}
