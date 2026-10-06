import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  FileSearch,
  LogOut,
  Menu,
  PackageSearch,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = user
    ? user.role === 'admin'
      ? [['Overview', '/admin'], ['Items', '/admin/items'], ['Claims', '/admin/claims'], ['Users', '/admin/users'], ['Profile', '/profile']]
      : [['Overview', '/dashboard'], ['Items', '/items'], ['My reports', '/my-reports'], ['My claims', '/my-claims'], ['Profile', '/profile']]
    : [['Home', '/'], ['Get started', '/register'], ['About', '/about']];

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'} onClick={closeMenu}>
          <span className="brand-mark"><PackageSearch size={20} strokeWidth={2.1} /></span>
          <span className="brand-name">Found<span>well</span></span>
        </Link>
        <button className="icon-button mobile-menu-button" type="button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`primary-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {links.map(([label, to]) => (
            <NavLink key={`${label}-${to}`} to={to} end={to === '/'} onClick={closeMenu}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-actions">
          {user ? (
            <>
              <Link className="profile-link" to="/profile" aria-label="Open profile">
                <span className="avatar avatar-small">{user.name?.charAt(0)?.toUpperCase()}</span>
                <span className="profile-name">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={15} />
              </Link>
              <button className="icon-button logout-button" type="button" aria-label="Sign out" title="Sign out" onClick={logout}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link className="signin-link" to="/login">Sign in</Link>
              <Link className="button button-small" to="/register">Get started <ArrowRight size={15} /></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand"><PackageSearch size={16} /> Foundwell</span>
        <span>Campus items, back where they belong.</span>
        <Link to="/about">About this service <ArrowRight size={14} /></Link>
      </div>
    </footer>
  );
}

export function ItemCard({ item, actionLabel = 'View item' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const itemType = item.type?.toLowerCase();
  return (
    <article className="item-card">
      <Link className="item-card-media" to={`/items/${item._id}`} aria-label={`View ${item.title}`}>
        {item.image && !imageFailed ? (
          <img src={item.image} alt="" onError={() => setImageFailed(true)} />
        ) : (
          <div className={`item-placeholder ${itemType}`}>
            <Box size={30} strokeWidth={1.4} />
            <span>{item.type} item</span>
          </div>
        )}
        <span className={`type-badge ${itemType}`}>{item.type}</span>
      </Link>
      <div className="item-card-body">
        <div className="item-card-meta">
          <span>{item.category}</span>
          <span>{item.date ? new Date(item.date).toLocaleDateString() : 'Date not set'}</span>
        </div>
        <h3><Link to={`/items/${item._id}`}>{item.title}</Link></h3>
        <p className="item-location"><Compass size={14} /> {item.location}</p>
        <div className="item-card-bottom">
          <span className={`status-badge status-${item.status?.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span>
          <Link className="text-link" to={`/items/${item._id}`}>{actionLabel} <ArrowRight size={14} /></Link>
        </div>
      </div>
    </article>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search by item name...' }) {
  return (
    <label className="search-field">
      <Search size={18} aria-hidden="true" />
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {value && <button className="search-clear" type="button" onClick={() => onChange('')} aria-label="Clear search"><X size={16} /></button>}
    </label>
  );
}

export function FilterPanel({ filters, onChange, includeType = true }) {
  return (
    <div className="filter-panel">
      {includeType && (
        <label className="filter-control"><span>Type</span>
          <select value={filters.type || ''} onChange={(event) => onChange('type', event.target.value)}>
            <option value="">All types</option><option>Lost</option><option>Found</option>
          </select>
        </label>
      )}
      <label className="filter-control"><span>Status</span>
        <select value={filters.status || ''} onChange={(event) => onChange('status', event.target.value)}>
          <option value="">All statuses</option>
          {['Lost', 'Found', 'Claim Requested', 'Claim Approved', 'Returned', 'Closed'].map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      <label className="filter-control"><span>Category</span>
        <input value={filters.category || ''} onChange={(event) => onChange('category', event.target.value)} placeholder="Any category" />
      </label>
      <label className="filter-control"><span>Location</span>
        <input value={filters.location || ''} onChange={(event) => onChange('location', event.target.value)} placeholder="Any location" />
      </label>
    </div>
  );
}

export function DashboardCard({ label, value, detail, icon: Icon, accent = 'blue', to }) {
  const content = (
    <>
      <div className={`metric-icon ${accent}`}>{Icon ? <Icon size={19} /> : <FileSearch size={19} />}</div>
      <div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
      {to && <ArrowRight className="metric-arrow" size={17} />}
    </>
  );
  return to ? <Link className="metric-card" to={to}>{content}</Link> : <article className="metric-card">{content}</article>;
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner label="Checking your session" />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminRoute() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

export function LoadingSpinner({ label = 'Loading' }) {
  return <div className="loading-state" role="status"><span className="spinner" /> <span>{label}</span></div>;
}

export function ErrorMessage({ children, onDismiss }) {
  if (!children) return null;
  return <div className="error-message" role="alert"><CircleHelp size={17} /><span>{children}</span>{onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss error"><X size={16} /></button>}</div>;
}

export function Modal({ title, children, onClose, wide = false }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header"><h2>{title}</h2><button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}

export function FormInput({ label, error, as = 'input', options, ...props }) {
  const Element = as;
  return (
    <label className={`form-field ${error ? 'has-error' : ''}`}>
      <span>{label}{props.required && <b aria-hidden="true"> *</b>}</span>
      {as === 'select' ? (
        <select {...props}>{options?.map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}</select>
      ) : (
        <Element {...props} />
      )}
      {error && <small>{error}</small>}
    </label>
  );
}

export function EmptyState({ icon: Icon = FileSearch, title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={24} /></span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

export function StatusPill({ children }) {
  const value = String(children || 'Pending');
  return <span className={`status-badge status-${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>;
}

export function InitialAvatar({ name, large = false }) {
  return <span className={`avatar ${large ? 'avatar-large' : ''}`}>{name?.trim()?.charAt(0)?.toUpperCase() || <UserRound size={16} />}</span>;
}

export function AdminBadge() {
  return <span className="role-badge"><ShieldCheck size={13} /> Admin</span>;
}

export { Check, Search, ArrowRight };