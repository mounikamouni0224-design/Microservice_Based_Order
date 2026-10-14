import { Bell, Mail, MessageSquareText } from 'lucide-react'
import { EmptyState, ErrorState, LoadingState, PageHeading, StatusBadge } from './Ui.jsx'

export default function Notifications({ notifications, error, loading, onRefresh }) {
  return (
    <div>
      <PageHeading eyebrow="SERVICE ACTIVITY" title="Notifications" description="Review notification messages recorded by the notification service." />
      <section className="panel">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600"><Bell size={17} /></span><div><h2 className="section-title">Notification log</h2><p className="section-caption">Message status and recipient</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">{notifications.length} messages</span></div>
        {error ? <ErrorState message={error} onRetry={onRefresh} /> : loading && !notifications.length ? <LoadingState label="Loading notifications..." /> : notifications.length ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => <article className="flex gap-3 px-5 py-4 sm:gap-4" key={item.id}>
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-500"><MessageSquareText size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><strong className="text-xs font-semibold text-slate-700">{item.recipient}</strong><span className="hidden text-slate-300 sm:inline">·</span><span className="hidden items-center gap-1 text-[10px] text-slate-400 sm:inline-flex"><Mail size={12} />Notification</span></div><StatusBadge value={item.status} /></div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{item.message}</p>
                <p className="mt-2 text-[10px] text-slate-400">{item.dateCreated ? new Date(item.dateCreated).toLocaleString() : 'Timestamp not provided by service'} <span className="mx-1">·</span> Notification #{item.id}</p>
              </div>
            </article>)}
          </div>
        ) : <EmptyState title="No notifications yet" description="Messages recorded by the notification service will appear here." />}
      </section>
    </div>
  )
}
