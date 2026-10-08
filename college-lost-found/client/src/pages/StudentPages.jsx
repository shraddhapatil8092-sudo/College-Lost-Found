import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building,
  Check,
  ClipboardList,
  Compass,
  FileSearch,
  FileText,
  ImagePlus,
  LocateFixed,
  MapPin,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
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
        <div>
          <span className="eyebrow"><Sparkles size={13} /> Student Portal</span>
          <h1>Welcome back, {user.name?.split(' ')[0]} 👋</h1>
          <p>Here’s the current lost and found activity across campus.</p>
        </div>
        <div className="dashboard-welcome-actions">
          <Link className="button button-small" to="/items/new/lost">
            <Plus size={16} /> Report Lost
          </Link>
          <Link className="button button-small button-secondary" to="/items/new/found">
            Report Found
          </Link>
        </div>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? (
        <LoadingSpinner label="Loading your dashboard" />
      ) : (
        <>
          <section className="metric-grid">
            <DashboardCard
              label="Your Reports"
              value={reports.filter((item) => !['Returned', 'Closed'].includes(item.status)).length}
              detail="Active reports you filed"
              icon={FileText}
              accent="blue"
              to="/my-reports"
            />
            <DashboardCard
              label="Your Claims"
              value={claims.length}
              detail="Claims submitted by you"
              icon={ClipboardList}
              accent="mint"
              to="/my-claims"
            />
            <DashboardCard
              label="Found Items"
              value={items.filter((item) => item.type === 'Found' && !['Returned', 'Closed'].includes(item.status)).length}
              detail="Waiting for their owners"
              icon={BadgeCheck}
              accent="gold"
              to="/items/found"
            />
          </section>
          <section className="content-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Campus Feed</span>
                <h2>Recently Reported Items</h2>
              </div>
              <Link className="text-link" to="/items">
                Browse all <ArrowRight size={15} />
              </Link>
            </div>
            {recentItems.length ? (
              <div className="item-grid item-grid-three">
                {recentItems.map((item) => (
                  <ItemCard key={item._id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No reports yet"
                description="Start the first report for your campus."
                action={
                  <Link className="button button-small" to="/items/new/lost">
                    Report an item <ArrowRight size={15} />
                  </Link>
                }
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}

export function BrowseItems({ type }) {
  const [searchParams] = useSearchParams();
  const queryCategory = searchParams.get('category') || '';
  const querySearch = searchParams.get('search') || '';

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState(querySearch);
  const [filters, setFilters] = useState({
    type: type || '',
    status: '',
    category: queryCategory,
    location: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const quickCategories = [
    'All Categories',
    'Electronics',
    'Bags',
    'ID & Keys',
    'Books & Stationery',
    'Bottles',
    'Accessories',
  ];

  useEffect(() => {
    const qCat = searchParams.get('category');
    const qSearch = searchParams.get('search');
    if (qCat !== null) setFilters((prev) => ({ ...prev, category: qCat }));
    if (qSearch !== null) setSearch(qSearch);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries({ ...filters, title: search }).filter(([, value]) => value)
      );
      api
        .get('/items', { params })
        .then(({ data }) => {
          if (active) setItems(data.items);
        })
        .catch((requestError) => {
          if (active) setError(getApiError(requestError, 'Unable to search items.'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
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
      <PageHeading
        eyebrow="Campus directory"
        title={title}
        description="Search recent reports and filter down to the details you remember."
        action={
          <div className="browse-header-actions">
            <Link className="button button-small" to="/items/new/lost">
              <Plus size={16} /> Report lost
            </Link>
            <Link className="button button-small button-secondary" to="/items/new/found">
              Report found
            </Link>
          </div>
        }
      />
      <nav className="browse-tabs" aria-label="Item type">
        <NavLink to="/items" end>
          All items
        </NavLink>
        <NavLink to="/items/lost">Lost items</NavLink>
        <NavLink to="/items/found">Found items</NavLink>
      </nav>
      <div className="category-chips">
        {quickCategories.map((cat) => {
          const isSelected =
            cat === 'All Categories'
              ? !filters.category
              : filters.category.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              type="button"
              className={`chip ${isSelected ? 'active' : ''}`}
              onClick={() => updateFilter('category', cat === 'All Categories' ? '' : cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>
      <section className="browse-tools">
        <SearchBar value={search} onChange={setSearch} />
        <FilterPanel filters={filters} onChange={updateFilter} />
      </section>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="results-line">
        <span>
          {loading ? 'Searching…' : `${items.length} ${items.length === 1 ? 'result' : 'results'}`}
        </span>
        <span>Latest reports first</span>
      </div>
      {loading ? (
        <LoadingSpinner label="Finding items" />
      ) : items.length ? (
        <div className="item-grid">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No matching items"
          description="Try another keyword or clear a filter."
        />
      )}
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
  const [locationTab, setLocationTab] = useState('spots');

  const categoryOptions = [
    'Electronics',
    'Bags',
    'ID & Keys',
    'Books & Stationery',
    'Bottles',
    'Accessories',
  ];

  const campusSpots = [
    'Library',
    'Cafeteria / Canteen',
    'Main Auditorium',
    'Computer Lab',
    'Sports Complex / Gym',
    'Classrooms / Lecture Hall',
    'Admin Office',
    'Parking Area / Gate',
    'Campus Garden / Ground',
    'Science Lab',
  ];

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

  async function fetchNetworkLocation() {
    setLocationLoading(true);
    setLocationMessage('Detecting location via network…');
    try {
      const { data } = await api.get('/items/detect-location');
      const loc = data?.location || '17.063583, 74.281837 (Campus Grounds)';
      update('location', loc);
      setLocationMessage(`✓ Location captured: ${loc}`);
      setValidationError('');
    } catch {
      const campusLoc = '17.063583, 74.281837 (Campus Grounds)';
      update('location', campusLoc);
      setLocationMessage(`✓ Campus location set: ${campusLoc}`);
      setValidationError('');
    } finally {
      setLocationLoading(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      fetchNetworkLocation();
      return;
    }

    setLocationLoading(true);
    setLocationMessage('Requesting GPS coordinates…');

    let handled = false;
    const fallbackTimer = setTimeout(() => {
      if (!handled) {
        handled = true;
        fetchNetworkLocation();
      }
    }, 4500);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (handled) return;
        handled = true;
        clearTimeout(fallbackTimer);
        const location = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        update('location', location);
        setLocationMessage(`✓ Live GPS captured: ${location}`);
        setValidationError('');
        setLocationLoading(false);
      },
      (_err) => {
        if (handled) return;
        handled = true;
        clearTimeout(fallbackTimer);
        fetchNetworkLocation();
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 },
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
      const fields = ['title', 'description', 'category', 'location', 'contact', 'date', 'type', 'image'];
      const values = Object.fromEntries(fields.map((field) => [field, form[field]]));
      if (!values.image) delete values.image;
      if (imageFile) values.imageFile = imageFile;
      onSubmit(values);
    }}>
      <div className="form-grid-two">
        <FormInput label="Item title" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Blue water bottle, ID Card..." required maxLength={120} />
        
        {/* Category Selector matching Dashboard */}
        <label className="form-field">
          <span>Category <b aria-hidden="true">*</b></span>
          <input
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            placeholder="Select or type category (e.g. Bottles, Electronics...)"
            list="item-categories-list"
            required
            maxLength={80}
          />
          <datalist id="item-categories-list">
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          <div className="category-chips-mini">
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`chip-mini ${form.category.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                onClick={() => update('category', cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </label>
      </div>

      <FormInput label="Description" as="textarea" rows={3} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe identifying details, color, brand, condition..." required maxLength={5000} />
      
      {/* Location Picker with Tabs */}
      <div className="location-picker-group">
        <label className="form-field">
          <span>Location <b aria-hidden="true">*</b></span>
        </label>
        <div className="location-tabs" role="tablist">
          <button
            type="button"
            className={`loc-tab ${locationTab === 'spots' ? 'active' : ''}`}
            onClick={() => setLocationTab('spots')}
          >
            <Building size={14} /> Campus Spot
          </button>
          <button
            type="button"
            className={`loc-tab ${locationTab === 'gps' ? 'active' : ''}`}
            onClick={() => setLocationTab('gps')}
          >
            <LocateFixed size={14} /> Fetch Location
          </button>
          <button
            type="button"
            className={`loc-tab ${locationTab === 'custom' ? 'active' : ''}`}
            onClick={() => setLocationTab('custom')}
          >
            <MapPin size={14} /> Custom
          </button>
        </div>

        {locationTab === 'spots' && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <select
              value={campusSpots.includes(form.location) ? form.location : ''}
              onChange={(e) => {
                update('location', e.target.value);
                setValidationError('');
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: '9px',
                background: '#f8fafc',
                fontSize: '14px',
              }}
            >
              <option value="">-- Choose a Campus Location --</option>
              {campusSpots.map((spot) => (
                <option key={spot} value={spot}>{spot}</option>
              ))}
            </select>
            <div className="location-chips-mini">
              {campusSpots.slice(0, 5).map((spot) => (
                <button
                  key={spot}
                  type="button"
                  className={`chip-mini ${form.location === spot ? 'active' : ''}`}
                  onClick={() => update('location', spot)}
                >
                  {spot}
                </button>
              ))}
            </div>
          </div>
        )}

        {locationTab === 'gps' && (
          <div className="location-gps-box">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="button button-small"
                onClick={useCurrentLocation}
                disabled={locationLoading}
              >
                <LocateFixed size={15} /> {locationLoading ? 'Detecting…' : 'Detect My Location'}
              </button>
              <button
                type="button"
                className="button button-small button-secondary"
                onClick={() => {
                  update('location', '17.063583, 74.281837 (Campus Grounds)');
                  setLocationMessage('✓ Campus Grounds coordinates set.');
                }}
              >
                <Building size={14} /> Campus GPS (17.0635, 74.2818)
              </button>
            </div>
            {locationMessage && <small className="location-message" role="status">{locationMessage}</small>}
            <small style={{ color: 'var(--ink-light, #64748b)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              ✓ Automatically falls back to network location if browser GPS permission is blocked.
            </small>
          </div>
        )}

        {locationTab === 'custom' && (
          <input
            type="text"
            placeholder="e.g. Room 204, Chemistry Bench 3, 2nd Floor..."
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            maxLength={200}
            required
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--line)',
              borderRadius: '9px',
              background: '#f8fafc',
              fontSize: '14px',
            }}
          />
        )}

        {form.location && (
          <div className="location-selected-preview">
            <MapPin size={13} />
            <span>Selected Location: <strong>{form.location}</strong></span>
          </div>
        )}
      </div>

      <div className="form-grid-two">
        <FormInput label="Date" type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required />
        <FormInput label="Report type" as="select" value={form.type} onChange={(event) => update('type', event.target.value)} options={['Lost', 'Found']} required />
      </div>
      <FormInput label="Contact details (Optional)" type="text" value={form.contact || ''} onChange={(event) => update('contact', event.target.value)} placeholder="e.g. Phone / WhatsApp or Room (optional)" maxLength={100} />
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
    title: '', description: '', category: '', location: '', contact: '', date: new Date().toISOString().slice(0, 10), type, image: '',
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

  const [itemClaims, setItemClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [busyClaimId, setBusyClaimId] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/items/${id}`)
      .then(({ data }) => { if (active) setItem(data.item); })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load this item.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!item) return;
    const repId = item.reportedBy?._id || item.reportedBy;
    if (user.role === 'admin' || repId === user.id) {
      setClaimsLoading(true);
      api.get(`/claims/item/${id}`)
        .then(({ data }) => setItemClaims(data.claims))
        .catch(() => {})
        .finally(() => setClaimsLoading(false));
    }
  }, [item, id, user]);

  async function handleDecideClaim(claimId, decision) {
    setBusyClaimId(claimId);
    try {
      const { data } = await api.put(`/claims/${claimId}/${decision}`);
      setItemClaims((current) => current.map((c) => (c._id === claimId ? data.claim : c)));
      if (decision === 'approve') {
        setItem((current) => ({ ...current, status: 'Returned' }));
      }
    } catch (requestError) {
      setError(getApiError(requestError, `Unable to ${decision} claim.`));
    } finally {
      setBusyClaimId('');
    }
  }

  async function quickStatus(newStatus) {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put(`/items/${id}`, { status: newStatus });
      setItem(data.item);
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to change status.'));
    } finally {
      setBusy(false);
    }
  }

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
            {item.contact && <div><dt>Contact</dt><dd>{item.contact}</dd></div>}
          </dl>
          {canManage ? (
            <div className="detail-manage-box">
              <div className="detail-actions">
                <button className="button" type="button" onClick={() => setEditOpen(true)}>Edit report</button>
                <button className="button button-secondary" type="button" onClick={() => setDeleteOpen(true)}><Trash2 size={16} /> Delete</button>
              </div>
              <div className="quick-status-actions" style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {item.status !== 'Returned' && (
                  <button className="button button-small button-secondary" type="button" onClick={() => quickStatus('Returned')} disabled={busy}>
                    <Check size={14} /> Mark Returned
                  </button>
                )}
                {item.status !== 'Closed' && (
                  <button className="button button-small button-secondary" type="button" onClick={() => quickStatus('Closed')} disabled={busy}>
                    Close Report
                  </button>
                )}
                {(item.status === 'Returned' || item.status === 'Closed') && (
                  <button className="button button-small button-secondary" type="button" onClick={() => quickStatus(item.type)} disabled={busy}>
                    <RefreshCw size={14} /> Reopen Report
                  </button>
                )}
              </div>
            </div>
          ) : canClaim ? (
            <button className="button" type="button" onClick={() => setClaimOpen(true)}>Claim This Item <ArrowRight size={16} /></button>
          ) : <p className="closed-note"><BadgeCheck size={17} /> This item is no longer accepting claims.</p>}
        </div>
      </section>

      {canManage && itemClaims.length > 0 && (
        <section className="content-section item-claims-section" style={{ marginTop: '36px' }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Claims Management</span>
              <h2>Claims on this item ({itemClaims.length})</h2>
            </div>
          </div>
          <div className="claim-list">
            {itemClaims.map((cl) => (
              <article className="claim-row" key={cl._id} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="claimant-line" style={{ padding: 0 }}>
                    <InitialAvatar name={cl.claimant?.name} />
                    <div>
                      <strong>{cl.claimant?.name || 'Campus member'}</strong>
                      <span>{cl.claimant?.email} · ID: {cl.claimant?.studentId}</span>
                    </div>
                  </div>
                  <StatusPill>{cl.status}</StatusPill>
                </div>
                <div className="claim-proof" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                  <div><span>Message</span><p>{cl.message}</p></div>
                  <div><span>Proof description</span><p>{cl.proofDescription}</p></div>
                </div>
                {cl.status === 'Pending' && (
                  <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="button button-small button-secondary" type="button" onClick={() => handleDecideClaim(cl._id, 'reject')} disabled={busyClaimId === cl._id}>
                      <X size={14} /> Reject
                    </button>
                    <button className="button button-small" type="button" onClick={() => handleDecideClaim(cl._id, 'approve')} disabled={busyClaimId === cl._id}>
                      <Check size={14} /> Approve &amp; Return
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

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

  async function handleDeleteClaim(claimId) {
    if (!window.confirm('Withdraw this claim? This will permanently remove your claim from the database.')) return;
    try {
      await api.delete(`/claims/${claimId}`);
      setClaims((current) => current.filter((c) => c._id !== claimId));
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to delete this claim.'));
    }
  }

  return (
    <main className="page-wrap standard-page">
      <PageHeading eyebrow="Your activity" title="My claims" description="Track the items you’ve asked to reclaim." />
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingSpinner label="Loading your claims" /> : claims.length ? (
        <div className="claim-list">{claims.map((claim) => (
          <article className="claim-row" key={claim._id}>
            <div className="claim-row-main"><div className="claim-item-icon"><FileText size={19} /></div><div><Link className="claim-item-title" to={claim.item ? `/items/${claim.item._id}` : '/my-claims'}>{claim.item?.title || 'Item no longer available'}</Link><span className="claim-date">Submitted {new Date(claim.createdAt).toLocaleDateString()}</span><p>{claim.message}</p><small>Proof: {claim.proofDescription}</small></div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <StatusPill>{claim.status}</StatusPill>
              {claim.status === 'Pending' && (
                <button
                  className="icon-button danger-icon"
                  type="button"
                  aria-label="Delete claim"
                  title="Withdraw claim"
                  onClick={() => handleDeleteClaim(claim._id)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </article>
        ))}</div>
      ) : <EmptyState icon={ClipboardList} title="No claims yet" description="When you recognize an item, submit a claim from its detail page." action={<Link className="quiet-link" to="/items">View items <ArrowRight size={15} /></Link>} />}
    </main>
  );
}

export function Profile() {
  const { user, updateUser } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [nameBusy, setNameBusy] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  async function handleUpdateName(event) {
    event.preventDefault();
    if (!nameForm.name.trim()) {
      setNameError('Name cannot be empty');
      return;
    }
    setNameBusy(true);
    setNameError('');
    setNameSuccess('');
    try {
      const { data } = await api.put('/auth/profile', { name: nameForm.name.trim() });
      updateUser(data.user);
      setNameSuccess('Profile name updated successfully!');
    } catch (requestError) {
      setNameError(getApiError(requestError, 'Unable to update profile name.'));
    } finally {
      setNameBusy(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordBusy(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (requestError) {
      setPasswordError(getApiError(requestError, 'Unable to change password.'));
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <main className="page-wrap standard-page profile-page">
      <PageHeading eyebrow="Account" title="Your profile" description="Manage your campus account credentials and security." />
      <div className="profile-layout" style={{ display: 'grid', gap: '28px' }}>
        <section className="profile-sheet">
          <div className="profile-identity">
            <InitialAvatar name={user?.name} large />
            <div>
              <h2>{user?.name}</h2>
              <span>{user?.role === 'admin' ? 'Campus administrator' : 'Student account'}</span>
            </div>
          </div>
          <dl className="profile-facts">
            <div><dt>Email address</dt><dd>{user?.email}</dd></div>
            <div><dt>Student ID</dt><dd>{user?.studentId}</dd></div>
            <div><dt>Account role</dt><dd><span className={`role-label ${user?.role}`}>{user?.role}</span></dd></div>
            <div><dt>Member since</dt><dd>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</dd></div>
          </dl>
        </section>

        <section className="profile-edit-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <article className="form-layout" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', display: 'grid', gap: '14px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Update Name</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>Change your display name visible across reports.</p>
            </div>
            {nameSuccess && <div style={{ color: 'var(--teal-dark)', background: 'var(--teal-soft)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}><Check size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{nameSuccess}</div>}
            <ErrorMessage>{nameError}</ErrorMessage>
            <form className="stack-form" onSubmit={handleUpdateName}>
              <FormInput label="Full Name" value={nameForm.name} onChange={(e) => setNameForm({ name: e.target.value })} required maxLength={100} />
              <button className="button button-small" type="submit" disabled={nameBusy}>
                {nameBusy ? 'Saving…' : 'Save Name'}
              </button>
            </form>
          </article>

          <article className="form-layout" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', display: 'grid', gap: '14px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Change Password</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>Keep your account protected with a strong password.</p>
            </div>
            {passwordSuccess && <div style={{ color: 'var(--teal-dark)', background: 'var(--teal-soft)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}><Check size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{passwordSuccess}</div>}
            <ErrorMessage>{passwordError}</ErrorMessage>
            <form className="stack-form" onSubmit={handleChangePassword}>
              <FormInput label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
              <FormInput label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} />
              <FormInput label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required minLength={6} />
              <button className="button button-small" type="submit" disabled={passwordBusy}>
                {passwordBusy ? 'Updating…' : 'Change Password'}
              </button>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}