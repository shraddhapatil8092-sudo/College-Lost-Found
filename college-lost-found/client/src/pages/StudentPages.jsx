import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  FileText,
  ImagePlus,
  LocateFixed,
  Plus,
  PackageSearch,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { validateClaim, validateItem } from '../validation/forms.js';
import {
  DashboardCard,
  EmptyState,
  ErrorMessage,
  FilterPanel,
  FormInput,
  InitialAvatar,
  ItemCard,
  LoadingSpinner,
  Modal,
  PageHeading,
  SearchBar,
  StatusPill,
} from '../components/index.jsx';

function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/items')
      .then(({ data }) => { if (active) setItems(data.items); })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load items.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { items, setItems, loading, error, setError };
}

export function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/items'), api.get('/claims/my')])
      .then(([itemResponse, claimResponse]) => {
        if (!active) return;
        setItems(itemResponse.data.items);
        setClaims(claimResponse.data.claims);
      })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load your dashboard.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const reports = items.filter((item) => (item.reportedBy?._id || item.reportedBy) === user.id);
  const recentItems = items.slice(0, 3);

  return (
    <main className="page-wrap standard-page dashboard-page">
      <div className="dashboard-welcome">
        <div><span className="eyebrow">Student dashboard</span><h1>Good day, {user.name?.split(' ')[0]}.</h1><p>Here’s what’s happening around campus.</p></div>
        <Link className="button" to="/items/new/lost"><Plus size={17} /> Report an item</Link>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingSpinner label="Loading your dashboard" /> : <>
        <section className="metric-grid">
          <DashboardCard label="Open reports" value={reports.filter((item) => !['Returned', 'Closed'].includes(item.status)).length} detail="Items you reported" icon={FileText} accent="blue" to="/my-reports" />
          <DashboardCard label="Your claims" value={claims.length} detail="Across all items" icon={ClipboardList} accent="mint" to="/my-claims" />
          <DashboardCard label="Items found" value={items.filter((item) => item.type === 'Found' && !['Returned', 'Closed'].includes(item.status)).length} detail="Still looking for owners" icon={BadgeCheck} accent="gold" to="/items/found" />
        </section>
        <section className="content-section">
          <div className="section-heading"><div><span className="eyebrow">Just in</span><h2>Recent campus reports</h2></div><Link className="text-link" to="/items">Browse all <ArrowRight size={15} /></Link></div>
          {recentItems.length ? <div className="item-grid item-grid-three">{recentItems.map((item) => <ItemCard key={item._id} item={item} />)}</div> : <EmptyState title="No reports yet" description="Start the first report for your campus." action={<Link className="button button-small" to="/items/new/lost">Report an item <ArrowRight size={15} /></Link>} />}
        </section>
      </>}
    </main>
  );
}

export function BrowseItems({ type }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: type || '', status: '', category: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = Object.fromEntries(Object.entries({ ...filters, title: search }).filter(([, value]) => value));
      api.get('/items', { params })
        .then(({ data }) => { if (active) setItems(data.items); })
        .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to search items.')); })
        .finally(() => { if (active) setLoading(false); });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [filters, search]);

  useEffect(() => {
    setFilters((current) => ({ ...current, type: type || '' }));
  }, [type]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const title = type ? `${type} items` : 'Campus items';
  return (
    <main className="page-wrap standard-page">
      <PageHeading eyebrow="Campus directory" title={title} description="Search recent reports and filter down to the details you remember." action={<div className="browse-header-actions"><Link className="button button-small" to="/items/new/lost"><Plus size={16} /> Report lost</Link><Link className="button button-small button-secondary" to="/items/new/found">Report found</Link></div>} />
      <nav className="browse-tabs" aria-label="Item type">
        <NavLink to="/items" end>All items</NavLink>
        <NavLink to="/items/lost">Lost items</NavLink>
        <NavLink to="/items/found">Found items</NavLink>
      </nav>
      <section className="browse-tools">
        <SearchBar value={search} onChange={setSearch} />
        <FilterPanel filters={filters} onChange={updateFilter} />
      </section>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="results-line"><span>{loading ? 'Searching…' : `${items.length} ${items.length === 1 ? 'result' : 'results'}`}</span><span>Latest reports first</span></div>
      {loading ? <LoadingSpinner label="Finding items" /> : items.length ? <div className="item-grid">{items.map((item) => <ItemCard key={item._id} item={item} />)}</div> : <EmptyState icon={Search} title="No matching items" description="Try another keyword or clear a filter." />}
    </main>
  );
}

function ItemForm({ initial, onSubmit, submitLabel, busy, error }) {
  const [form, setForm] = useState(initial);
  const [validationError, setValidationError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not available in this browser. Enter it manually.');
      return;
    }

    setLocationLoading(true);
    setLocationMessage('Getting your current location…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        update('location', location);
        setLocationMessage('Current GPS coordinates added. You can edit them if the item was lost elsewhere.');
        setValidationError('');
        setLocationLoading(false);
      },
      (locationError) => {
        const message = locationError.code === locationError.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access in your browser or enter a location manually.'
          : locationError.code === locationError.TIMEOUT
            ? 'Location lookup timed out. Try again or enter a location manually.'
            : 'Unable to get your current location. Enter it manually.';
        setLocationMessage(message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  function updateImageFile(event) {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setImageFile(null);
      setValidationError('');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageFile(null);
      setValidationError('Choose a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageFile(null);
      setValidationError('Image must be 5 MB or smaller');
      return;
    }
    setImageFile(file);
    setValidationError('');
  }

  return (
    <form className="stack-form" noValidate onSubmit={(event) => {
      event.preventDefault();
      const validationMessage = validateItem(form);
      if (validationMessage) {
        setValidationError(validationMessage);
        return;
      }
      if (form.type === 'Found' && !form.image?.trim() && !imageFile) {
        setValidationError('Add a photo of the found item');
        return;
      }
      setValidationError('');
      const fields = ['title', 'description', 'category', 'location', 'date', 'type', 'image'];
      const values = Object.fromEntries(fields.map((field) => [field, form[field]]));
      if (!values.image) delete values.image;
      if (imageFile) values.imageFile = imageFile;
      onSubmit(values);
    }}>
      <div className="form-grid-two">
        <FormInput label="Item title" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Blue water bottle" required maxLength={120} />
        <FormInput label="Category" value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="e.g. Electronics" required maxLength={80} />
      </div>
      <FormInput label="Description" as="textarea" rows={4} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe identifying details" required maxLength={5000} />
      <div className="form-grid-two">
        <div className="location-field-wrap">
          <FormInput label="Location" value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Coordinates or where it was lost/found" required maxLength={200} />
          <button className="button button-secondary button-small location-button" type="button" onClick={useCurrentLocation} disabled={locationLoading}>
            <LocateFixed size={15} /> {locationLoading ? 'Locating…' : 'Use current location'}
          </button>
          {locationMessage && <small className="location-message" role="status">{locationMessage}</small>}
        </div>
        <FormInput label="Date" type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required />
      </div>
      <FormInput label="Report type" as="select" value={form.type} onChange={(event) => update('type', event.target.value)} options={['Lost', 'Found']} required />
      <FormInput label="Image URL" type="url" value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="https://… (optional)" />
      <label className="form-field image-upload-field">
        <span>Upload item photo{form.type === 'Found' && !form.image && !imageFile ? ' *' : ''}</span>
        <span className="image-upload-control"><ImagePlus size={17} /><span>{imageFile?.name || 'Choose a photo'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={updateImageFile} /></span>
        <small>JPEG, PNG, or WebP · up to 5 MB{form.type === 'Found' && !form.image && !imageFile ? ' · required for found items' : ''}</small>
      </label>
      {(imagePreview || form.image) && <div className="image-upload-preview"><img src={imagePreview || form.image} alt="Selected item preview" /><button className="button button-secondary button-small" type="button" onClick={() => { setImageFile(null); update('image', ''); }}>Remove photo</button></div>}
      <ErrorMessage>{validationError || error}</ErrorMessage>
      <button className="button" type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel} <ArrowRight size={16} /></button>
    </form>
  );
}

function emptyItem(type) {
  return {
    title: '', description: '', category: '', location: '', date: new Date().toISOString().slice(0, 10), type, image: '',
  };
}

async function prepareItemPayload(values) {
  const { imageFile, ...payload } = values;
  if (imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const { data } = await api.post('/items/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    payload.image = data.imageUrl;
  }
  if (!payload.image) delete payload.image;
  return payload;
}

export function ReportItem({ type = 'Lost' }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(values) {
    setBusy(true);
    setError('');
    try {
      const payload = await prepareItemPayload(values);
      const { data } = await api.post('/items', payload);
      navigate(`/items/${data.item._id}`);
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to submit this report.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-wrap standard-page form-page">
      <PageHeading eyebrow="New campus report" title={`Report a ${type.toLowerCase()} item`} description="Include a few specific details to help the right person recognize it." />
      <div className="form-layout">
        <ItemForm key={type} initial={emptyItem(type)} onSubmit={handleSubmit} submitLabel="Submit report" busy={busy} error={error} />
        <aside className="form-aside"><span className="aside-icon"><ShieldCheck size={23} /></span><h2>A useful clue goes a long way.</h2><p>Share identifying details, but keep one small detail private so the owner can verify a claim.</p><div className="aside-rule" /><span>Reports are visible to signed-in campus members.</span></aside>
      </div>
    </main>
  );
}

export function ItemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimOpen, setClaimOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [claimForm, setClaimForm] = useState({ message: '', proofDescription: '' });

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/items/${id}`)
      .then(({ data }) => { if (active) setItem(data.item); })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load this item.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function saveItem(values) {
    setBusy(true);
    setError('');
    try {
      const payload = await prepareItemPayload(values);
      const { data } = await api.put(`/items/${id}`, payload);
      setItem(data.item);
      setEditOpen(false);
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to update this item.'));
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem() {
    setBusy(true);
    try {
      await api.delete(`/items/${id}`);
      navigate('/my-reports', { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to delete this item.'));
      setDeleteOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function submitClaim(event) {
    event.preventDefault();
    const validationMessage = validateClaim(claimForm);
    if (validationMessage) {
      setClaimError(validationMessage);
      return;
    }
    setBusy(true);
    setClaimError('');
    try {
      await api.post('/claims', { item: id, ...claimForm });
      setClaimOpen(false);
      setClaimSuccess('Your claim was submitted for review.');
      setClaimForm({ message: '', proofDescription: '' });
    } catch (requestError) {
      setClaimError(getApiError(requestError, 'Unable to submit your claim.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="page-wrap standard-page"><LoadingSpinner label="Loading item details" /></main>;
  if (!item) return <main className="page-wrap standard-page"><ErrorMessage>{error || 'Item not found.'}</ErrorMessage><Link className="quiet-link" to="/items">Back to items <ArrowRight size={15} /></Link></main>;

  const reporterId = item.reportedBy?._id || item.reportedBy;
  const canManage = user.role === 'admin' || reporterId === user.id;
  const canClaim = !canManage && !['Returned', 'Closed'].includes(item.status);
  const itemInitial = { ...item, date: item.date?.slice(0, 10) || '', status: item.status };

  return (
    <main className="page-wrap standard-page details-page">
      <Link className="back-link" to="/items"><ArrowRight className="back-arrow" size={15} /> Back to items</Link>
      <ErrorMessage>{error}</ErrorMessage>
      <ErrorMessage>{claimSuccess}</ErrorMessage>
      <section className="item-detail-layout">
        <div className="detail-image">
          {item.image ? <img src={item.image} alt={item.title} /> : <div className={`item-placeholder ${item.type.toLowerCase()}`}><PackageSearch size={40} /><span>{item.type} item</span></div>}
        </div>
        <div className="detail-copy">
          <div className="detail-overline"><span className={`type-badge ${item.type.toLowerCase()}`}>{item.type}</span><StatusPill>{item.status}</StatusPill></div>
          <span className="eyebrow">{item.category}</span>
          <h1>{item.title}</h1>
          <p className="detail-description">{item.description}</p>
          <dl className="detail-facts">
            <div><dt>Last seen / found</dt><dd>{item.location}</dd></div>
            <div><dt>Date reported</dt><dd>{new Date(item.date).toLocaleDateString()}</dd></div>
            <div><dt>Reported by</dt><dd>{item.reportedBy?.name || 'Campus member'}</dd></div>
          </dl>
          {canManage ? (
            <div className="detail-actions"><button className="button" type="button" onClick={() => setEditOpen(true)}>Edit report</button><button className="button button-secondary" type="button" onClick={() => setDeleteOpen(true)}><Trash2 size={16} /> Delete</button></div>
          ) : canClaim ? (
            <button className="button" type="button" onClick={() => setClaimOpen(true)}>Claim This Item <ArrowRight size={16} /></button>
          ) : <p className="closed-note"><BadgeCheck size={17} /> This item is no longer accepting claims.</p>}
        </div>
      </section>

      {claimOpen && <Modal title="Submit a claim" onClose={() => setClaimOpen(false)}>
        <p className="modal-lede">Share a detail only the owner would know. An administrator will review your claim.</p>
        <form className="stack-form" noValidate onSubmit={submitClaim}>
          <FormInput label="Message" as="textarea" rows={3} value={claimForm.message} onChange={(event) => setClaimForm({ ...claimForm, message: event.target.value })} required maxLength={2000} />
          <FormInput label="Proof description" as="textarea" rows={4} value={claimForm.proofDescription} onChange={(event) => setClaimForm({ ...claimForm, proofDescription: event.target.value })} placeholder="Describe a unique detail or identifying mark" required maxLength={5000} />
          <ErrorMessage>{claimError}</ErrorMessage>
          <button className="button button-full" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Send claim'} <ArrowRight size={16} /></button>
        </form>
      </Modal>}
      {editOpen && <Modal title="Edit item report" onClose={() => setEditOpen(false)} wide><ItemForm initial={itemInitial} onSubmit={saveItem} submitLabel="Save changes" busy={busy} error={error} /></Modal>}
      {deleteOpen && <Modal title="Delete this report?" onClose={() => setDeleteOpen(false)}>
        <p className="modal-lede">“{item.title}” will be removed from the campus directory.</p>
        <div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setDeleteOpen(false)}>Cancel</button><button className="button button-danger" type="button" onClick={deleteItem} disabled={busy}>{busy ? 'Deleting…' : 'Delete report'}</button></div>
      </Modal>}
    </main>
  );
}

export function MyReports() {
  const { user } = useAuth();
  const { items, loading, error } = useItems();
  const reports = items.filter((item) => (item.reportedBy?._id || item.reportedBy) === user.id);
  return (
    <main className="page-wrap standard-page">
      <PageHeading eyebrow="Your activity" title="My reports" description="Items you’ve reported to the campus community." action={<Link className="button button-small" to="/items/new/lost"><Plus size={16} /> New report</Link>} />
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingSpinner label="Loading your reports" /> : reports.length ? <div className="item-grid">{reports.map((item) => <ItemCard key={item._id} item={item} actionLabel="Manage" />)}</div> : <EmptyState icon={FileText} title="No reports yet" description="Your lost and found reports will appear here." action={<Link className="button button-small" to="/items/new/lost">Create a report <ArrowRight size={15} /></Link>} />}
    </main>
  );
}

export function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get('/claims/my')
      .then(({ data }) => { if (active) setClaims(data.claims); })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load claims.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="page-wrap standard-page">
      <PageHeading eyebrow="Your activity" title="My claims" description="Track the items you’ve asked to reclaim." />
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingSpinner label="Loading your claims" /> : claims.length ? (
        <div className="claim-list">{claims.map((claim) => (
          <article className="claim-row" key={claim._id}>
            <div className="claim-row-main"><div className="claim-item-icon"><FileText size={19} /></div><div><Link className="claim-item-title" to={claim.item ? `/items/${claim.item._id}` : '/my-claims'}>{claim.item?.title || 'Item no longer available'}</Link><span className="claim-date">Submitted {new Date(claim.createdAt).toLocaleDateString()}</span><p>{claim.message}</p><small>Proof: {claim.proofDescription}</small></div></div>
            <StatusPill>{claim.status}</StatusPill>
          </article>
        ))}</div>
      ) : <EmptyState icon={ClipboardList} title="No claims yet" description="When you recognize an item, submit a claim from its detail page." action={<Link className="quiet-link" to="/items">View items <ArrowRight size={15} /></Link>} />}
    </main>
  );
}

export function Profile() {
  const { user } = useAuth();
  return (
    <main className="page-wrap standard-page profile-page">
      <PageHeading eyebrow="Account" title="Your profile" description="Your campus account details." />
      <section className="profile-sheet">
        <div className="profile-identity"><InitialAvatar name={user.name} large /><div><h2>{user.name}</h2><span>{user.role === 'admin' ? 'Campus administrator' : 'Student account'}</span></div></div>
        <dl className="profile-facts"><div><dt>Email address</dt><dd>{user.email}</dd></div><div><dt>Student ID</dt><dd>{user.studentId}</dd></div><div><dt>Account role</dt><dd>{user.role}</dd></div><div><dt>Member since</dt><dd>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</dd></div></dl>
        <p className="info-note"><ShieldCheck size={17} /> Profile editing is not available in the current account API.</p>
      </section>
    </main>
  );
}