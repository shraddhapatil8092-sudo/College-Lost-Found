import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Backpack,
  BookOpen,
  CheckCircle2,
  Coffee,
  Compass,
  FileSearch,
  KeyRound,
  Laptop,
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  UserCheck,
} from 'lucide-react';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { validateLogin, validateRegistration } from '../validation/forms.js';
import {
  EmptyState,
  ErrorMessage,
  FormInput,
  ItemCard,
  LoadingSpinner,
  PageHeading,
} from '../components/index.jsx';

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/items')
      .then(({ data }) => { if (active) setItems(data.items.slice(0, 6)); })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load recent reports.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/items?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/items');
    }
  }

  const categoryCards = [
    { name: 'Electronics', label: 'Laptops, Phones & Chargers', icon: Laptop, color: 'blue' },
    { name: 'Bags', label: 'Backpacks & Pouches', icon: Backpack, color: 'indigo' },
    { name: 'ID & Keys', label: 'College IDs, Keys & Wallets', icon: KeyRound, color: 'gold' },
    { name: 'Books & Stationery', label: 'Notebooks & Textbooks', icon: BookOpen, color: 'teal' },
    { name: 'Bottles', label: 'Flasks & Tumblers', icon: Coffee, color: 'cyan' },
    { name: 'Accessories', label: 'Earbuds, Glasses & Watches', icon: Tag, color: 'rose' },
  ];

  return (
    <main className="home-page page-wrap">
      {/* Hero Section */}
      <section className="home-intro">
        <div className="home-copy">
          <div className="hero-pill-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Campus Lost &amp; Found Portal • 100% Free</span>
          </div>
          <h1>
            Good things find their way <em>back.</em>
          </h1>
          <p>
            The dedicated campus platform to quickly report missing belongings, browse found items,
            and reunite possessions with their rightful owners safely.
          </p>

          <form className="hero-search-bar" onSubmit={handleSearchSubmit}>
            <Search size={18} className="hero-search-icon" />
            <input
              type="text"
              placeholder="Search lost laptops, keys, bottles, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="button button-small">
              Search
            </button>
          </form>

          <div className="home-actions">
            <Link className="button" to={user ? '/dashboard' : '/register'}>
              Get Started <ArrowRight size={16} />
            </Link>
            <Link className="button button-secondary" to="/items">
              <FileSearch size={16} /> Browse All Items
            </Link>
          </div>

          <div className="home-stats-strip">
            <div className="hero-stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-desc">Campus Verified</span>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat-item">
              <span className="stat-number">Real-Time</span>
              <span className="stat-desc">Instant Reporting</span>
            </div>
            <div className="stat-divider" />
            <div className="hero-stat-item">
              <span className="stat-number">Secure</span>
              <span className="stat-desc">Admin Reviewed</span>
            </div>
          </div>
        </div>

        <div className="home-art" aria-hidden="true">
          <div className="art-sheet art-sheet-back">
            <span className="art-line" />
            <span className="art-line short" />
            <span className="art-stamp">FOUND</span>
          </div>
          <div className="art-sheet art-sheet-front">
            <span className="art-tag">CAMPUS DIRECTORY</span>
            <div className="art-bag">
              <PackageSearch size={36} strokeWidth={1.5} />
            </div>
            <span className="art-title">Lost somewhere?<br /><b>Found together.</b></span>
            <span className="art-line" />
            <span className="art-line short" />
            <div className="art-badge-verified">
              <CheckCircle2 size={14} /> Safe Handover
            </div>
          </div>
          <span className="art-note note-one">Library Desk, 10:45 AM</span>
          <span className="art-note note-two">Reunited in 24 hrs</span>
        </div>
      </section>

      {/* Explore by Category */}
      <section className="home-categories-section">
        <div className="section-heading-centered">
          <span className="eyebrow"><Tag size={13} /> Categories</span>
          <h2>Explore by Category</h2>
          <p>Find what you're looking for across the most common campus belongings.</p>
        </div>
        <div className="category-grid">
          {categoryCards.map(({ name, label, icon: Icon, color }) => (
            <Link
              key={name}
              to={`/items?category=${encodeURIComponent(name)}`}
              className={`category-card accent-${color}`}
            >
              <div className={`category-icon-wrap bg-${color}`}>
                <Icon size={22} />
              </div>
              <div className="category-card-info">
                <h3>{name}</h3>
                <p>{label}</p>
              </div>
              <span className="category-arrow"><ArrowRight size={15} /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works-section">
        <div className="section-heading-centered">
          <span className="eyebrow"><Sparkles size={13} /> Simple &amp; Fast</span>
          <h2>How Foundwell Works</h2>
          <p>Three straightforward steps to recover or return lost belongings.</p>
        </div>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">01</div>
            <div className="how-icon-box blue"><FileSearch size={24} /></div>
            <h3>Report in Seconds</h3>
            <p>Upload item details, date, campus location, and a clear photo whether you lost or found something.</p>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <div className="how-icon-box amber"><Search size={24} /></div>
            <h3>Search &amp; Match</h3>
            <p>Use filters, categories, and keyword search to discover matching items anywhere on campus.</p>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <div className="how-icon-box emerald"><CheckCircle2 size={24} /></div>
            <h3>Claim &amp; Reconnect</h3>
            <p>Submit a claim with proof or unique details. Campus admins verify claims for a safe, hassle-free handover.</p>
          </div>
        </div>
      </section>

      {/* Recently Reported Items */}
      <section className="home-recent">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Community Feed</span>
            <h2>Recently Reported Items</h2>
          </div>
          <Link className="text-link" to="/items">
            View All Reports <ArrowRight size={15} />
          </Link>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
        {loading ? (
          <LoadingSpinner label="Loading recent items" />
        ) : items.length ? (
          <div className="item-grid item-grid-three">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No reports yet"
            description="The first report could be yours."
            action={
              <Link className="button button-small" to={user ? '/items/new/lost' : '/register'}>
                Start a report <ArrowRight size={15} />
              </Link>
            }
          />
        )}
      </section>

      {/* Community CTA Banner */}
      <section className="home-cta-banner">
        <div className="cta-banner-content">
          <span className="eyebrow eyebrow-light"><ShieldCheck size={14} /> Campus Safety First</span>
          <h2>Lost something or found an item today?</h2>
          <p>Help make our campus community more helpful and connected for everyone.</p>
          <div className="cta-banner-actions">
            <Link className="button button-light" to={user ? '/items/new/lost' : '/login'}>
              Report a Lost Item
            </Link>
            <Link className="button button-outline-light" to={user ? '/items/new/found' : '/login'}>
              Turn in a Found Item
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const registeredNotice = location.state?.registered ? 'Account created successfully! Please sign in below.' : '';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const validationMessage = validateLogin(form);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(form);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to sign in. Check your details and try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page page-wrap">
      <section className="auth-panel">
        <span className="eyebrow">Welcome back</span>
        <h1>Sign in to Foundwell</h1>
        <p className="auth-lede">Pick up where your campus left off.</p>
        {registeredNotice && (
          <div className="success-banner" style={{
            background: 'var(--mint-soft, #e6f7f2)',
            color: 'var(--mint-strong, #0d7053)',
            padding: '12px 16px',
            borderRadius: '9px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            ✓ {registeredNotice}
          </div>
        )}
        <ErrorMessage>{error}</ErrorMessage>
        {error && error.includes('register') && (
          <div style={{ marginTop: '-8px', marginBottom: '16px' }}>
            <Link className="button button-small" to="/register" state={{ email: form.email }}>
              Create Account with this Email <ArrowRight size={14} />
            </Link>
          </div>
        )}
        <form className="stack-form" noValidate onSubmit={handleSubmit}>
          <FormInput label="Email address" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <FormInput label="Password" type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          <button className="button button-full" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">New to Foundwell? <Link to="/register" state={{ email: form.email }}>Create an account</Link></p>
      </section>
      <aside className="auth-aside"><span className="aside-icon"><Compass size={25} /></span><p>“The best part of finding something is getting to give it back.”</p><span className="aside-caption">A better campus, one return at a time.</span></aside>
    </main>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: location.state?.email || '', studentId: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const validationMessage = validateRegistration(form);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to create your account.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page page-wrap register-page">
      <section className="auth-panel">
        <span className="eyebrow">Join the campus community</span>
        <h1>Create your account</h1>
        <p className="auth-lede">One account to report, browse, and help return items.</p>
        <ErrorMessage>{error}</ErrorMessage>
        <form className="stack-form" noValidate onSubmit={handleSubmit}>
          <FormInput label="Full name" autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Shraddha Patil" required />
          <FormInput label="Email address" type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="e.g. shraddha@college.edu" required />
          <div className="form-grid-two">
            <FormInput label="Student ID / Roll No." autoComplete="off" value={form.studentId} onChange={(event) => update('studentId', event.target.value)} placeholder="e.g. 1024 or STU-12 (optional)" />
            <FormInput label="Phone / WhatsApp" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="e.g. 9876543210 (optional)" />
          </div>
          <div className="form-grid-two">
            <FormInput label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="At least 6 characters" required />
            <FormInput label="Confirm password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} placeholder="Re-type password" required />
          </div>
          <button className="button button-full" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </section>
      <aside className="auth-aside auth-aside-register"><span className="aside-icon"><ShieldCheck size={25} /></span><p>Every report makes it a little easier for someone to find what they thought was gone.</p><span className="aside-caption">Made for your campus.</span></aside>
    </main>
  );
}

export function About() {
  return (
    <main className="page-wrap standard-page">
      <PageHeading eyebrow="About Foundwell" title="A campus works better when we look out for each other." description="Foundwell helps students report lost belongings, share found items, and reconnect the two." />
      <section className="about-grid">
        <article className="about-block"><span className="about-number">01</span><h2>Report what’s missing</h2><p>Add a few clear details about the item and where you last saw it. Your report becomes searchable by the campus community.</p></article>
        <article className="about-block"><span className="about-number">02</span><h2>Browse what’s found</h2><p>Search by title, category, type, or location to see whether someone has already turned it in.</p></article>
        <article className="about-block"><span className="about-number">03</span><h2>Help it get home</h2><p>Submit a claim with a message and identifying details. An administrator reviews claims before an item is marked returned.</p></article>
      </section>
      <div className="about-note"><ShieldCheck size={18} /><p>Claims are reviewed by campus administrators. Never include passwords or sensitive personal details in an item report.</p></div>
    </main>
  );
}