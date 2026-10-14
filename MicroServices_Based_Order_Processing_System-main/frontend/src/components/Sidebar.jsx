import {
  Bell,
  Boxes,
  Grid2X2,
  Menu,
  Play,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'

const links = [
  { id: 'dashboard', label: <>Overview<br />(Podsumowanie)</>, icon: Grid2X2 },
  { id: 'orders', label: <>Order Service (8083)</>, icon: ShoppingCart, service: 'orders' },
  { id: 'products', label: <>Product Service<br />(8082)</>, icon: Boxes, service: 'products' },
  { id: 'customers', label: <>Customer Service<br />(8081)</>, icon: Users, service: 'customers' },
  { id: 'notifications', label: <>Notification Service<br />(8084)</>, icon: Bell, service: 'notifications' },
]

export default function Sidebar({
  activeView,
  onNavigate,
  mobileOpen,
  onMobileToggle,
  errors = {},
  counts = {},
}) {
  const errorCount = Object.keys(errors).length
  const servicesOnline = errorCount === 0
  return (
    <>
      {mobileOpen && (
        <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => onMobileToggle(false)} />
      )}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <button className="brand-link" onClick={() => onNavigate('dashboard')}>
            <span className="brand-mark"><Boxes size={23} strokeWidth={2.2} /></span>
            <span className="brand-copy"><strong>OrderFlow</strong><small>MICROSERVICES</small></span>
          </button>
          <button className="sidebar-close icon-button" aria-label="Close navigation" onClick={() => onMobileToggle(false)}>
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-profile">
          <span className="profile-avatar" aria-hidden="true">JN</span>
          <span className="profile-copy"><strong>System Admin</strong><small>Jajula NagaMani</small></span>
          <i className="profile-online" aria-label="Online" />
        </div>

        <div className="sidebar-navigation">
          <p className="sidebar-section-title">MAIN NAVIGATION</p>
          <nav className="nav-list" aria-label="Main navigation">
            {links.map(({ id, label, icon: Icon, service }) => (
              <button
                key={id}
                className={`nav-link ${activeView === id ? 'nav-link-active' : ''}`}
                aria-current={activeView === id ? 'page' : undefined}
                onClick={() => onNavigate(id)}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span className="nav-label">{label}</span>
                {service && <span className={`nav-count ${service === 'notifications' ? 'nav-count-green' : ''}`}>{counts[service] ?? 0}</span>}
              </button>
            ))}
          </nav>

          <p className="sidebar-section-title interactive-heading">INTERACTIVE TESTING</p>
          <button className="orchestrator-link" onClick={() => onNavigate('orders')}>
            <Play size={16} />Live Order Orchestrator
          </button>
        </div>

        <div className="sidebar-status">
          <div className={`online-pill ${servicesOnline ? '' : 'online-pill-warning'}`}>
            <i />
            {servicesOnline ? '4 Microservices Online' : `${4 - errorCount} Microservices Online`}
          </div>
        </div>
      </aside>
      <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => onMobileToggle(true)}>
        <Menu size={19} />
      </button>
    </>
  )
}
