import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, ShieldCheck, Sparkles } from 'lucide-react';
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/items')
      .then(({ data }) => { if (active) setItems(data.items.slice(0, 3)); })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load recent reports.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="home-page page-wrap">
      <section className="home-intro">
        <div className="home-copy">
          <span className="eyebrow"><Sparkles size={14} /> Campus lost &amp; found</span>
          <h1>Good things<br />find their way <em>back.</em></h1>
          <p>A shared place for our campus to report missing belongings and return found ones to their owners.</p>
          <div className="home-actions">
            <Link className="button" to={user ? '/dashboard' : '/register'}>Get started <ArrowRight size={17} /></Link>
            <Link className="quiet-link" to={user ? '/items/new/lost' : '/login'}>Report a lost item <ArrowRight size={15} /></Link>
          </div>
          <div className="home-trust"><ShieldCheck size={16} /><span>Student-led. Campus-wide.</span><span className="trust-dot" /> <span>One helpful community</span></div>
        </div>
        <div className="home-art" aria-hidden="true">
          <div className="art-sheet art-sheet-back"><span className="art-line" /><span className="art-line short" /><span className="art-stamp">FOUND</span></div>
          <div className="art-sheet art-sheet-front"><span className="art-tag">A CAMPUS STORY</span><span className="art-bag"><Compass size={38} strokeWidth={1.35} /></span><span className="art-title">Lost here.<br /><b>Found together.</b></span><span className="art-line" /><span className="art-line short" /></div>
          <span className="art-note note-one">Library, 10:42</span>
          <span className="art-note note-two">A little more connected</span>
        </div>
      </section>

      <section className="home-recent">
        <div className="section-heading">
          <div><span className="eyebrow">From the community</span><h2>Recently reported</h2></div>
          <Link className="text-link" to={user ? '/items' : '/login'}>See all reports <ArrowRight size={15} /></Link>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
        {loading ? <LoadingSpinner label="Loading recent items" /> : items.length ? (
          <div className="item-grid item-grid-three">{items.map((item) => <ItemCard key={item._id} item={item} />)}</div>
        ) : (
          <EmptyState title="No reports yet" description="The first report could be yours." action={<Link className="quiet-link" to={user ? '/items/new/lost' : '/register'}>Start a report <ArrowRight size={15} /></Link>} />
        )}
      </section>
    </main>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        <ErrorMessage>{error}</ErrorMessage>
        <form className="stack-form" noValidate onSubmit={handleSubmit}>
          <FormInput label="Email address" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <FormInput label="Password" type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          <button className="button button-full" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">New to Foundwell? <Link to="/register">Create an account</Link></p>
      </section>
      <aside className="auth-aside"><span className="aside-icon"><Compass size={25} /></span><p>“The best part of finding something is getting to give it back.”</p><span className="aside-caption">A better campus, one return at a time.</span></aside>
    </main>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', studentId: '', password: '', confirmPassword: '' });
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
      await register(form);
      navigate('/login', { replace: true, state: { registered: true } });
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
          <FormInput label="Full name" autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} required />
          <FormInput label="Email address" type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
          <FormInput label="Student ID" autoComplete="off" value={form.studentId} onChange={(event) => update('studentId', event.target.value)} required />
          <div className="form-grid-two">
            <FormInput label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} required />
            <FormInput label="Confirm password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} required />
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