import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ClipboardList, FileSearch, PackageCheck, Trash2, UsersRound, X } from 'lucide-react';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  DashboardCard,
  EmptyState,
  ErrorMessage,
  InitialAvatar,
  LoadingSpinner,
  Modal,
  PageHeading,
  StatusPill,
} from '../components/index.jsx';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/admin/overview'), api.get('/claims')])
      .then(([overviewResponse, claimResponse]) => {
        if (!active) return;
        setStats(overviewResponse.data.stats);
        setClaims(claimResponse.data.claims);
      })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load administration data.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const pendingClaims = claims.filter((claim) => claim.status === 'Pending');
  return (
    <main className="page-wrap standard-page">
      <div className="dashboard-welcome admin-welcome"><div><span className="eyebrow">Administration</span><h1>Campus overview</h1><p>Keep item reports and claims moving.</p></div><Link className="button button-secondary" to="/admin/claims">Review claims <ArrowRight size={16} /></Link></div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingSpinner label="Loading overview" /> : <>
        <section className="metric-grid admin-metric-grid">
          <DashboardCard label="Total users" value={stats.totalUsers} detail="Registered accounts" icon={UsersRound} accent="blue" to="/admin/users" />
          <DashboardCard label="Lost items" value={stats.lostItems} detail="Reported lost" icon={FileSearch} accent="gold" to="/admin/items" />
          <DashboardCard label="Found items" value={stats.foundItems} detail="Reported found" icon={PackageCheck} accent="mint" to="/admin/items" />
          <DashboardCard label="Pending claims" value={stats.pendingClaims} detail="Awaiting review" icon={ClipboardList} accent="gold" to="/admin/claims" />
          <DashboardCard label="Returned items" value={stats.returnedItems} detail="Reunited with owners" icon={PackageCheck} accent="mint" to="/admin/items" />
        </section>
        <section className="content-section admin-queue">
          <div className="section-heading"><div><span className="eyebrow">Needs attention</span><h2>Pending claims</h2></div><Link className="text-link" to="/admin/claims">Open queue <ArrowRight size={15} /></Link></div>
          {pendingClaims.length ? <div className="claim-list">{pendingClaims.slice(0, 4).map((claim) => <article className="claim-row" key={claim._id}><div className="claim-row-main"><div className="claim-item-icon"><ClipboardList size={18} /></div><div><Link className="claim-item-title" to="/admin/claims">{claim.item?.title || 'Item claim'}</Link><span className="claim-date">{claim.claimant?.name || 'Campus member'} · {new Date(claim.createdAt).toLocaleDateString()}</span><p>{claim.message}</p></div></div><StatusPill>{claim.status}</StatusPill></article>)}</div> : <EmptyState title="All caught up" description="There are no pending claims to review." />}
        </section>
      </>}
    </main>
  );
}

export function ManageItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteItem, setDeleteItem] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadItems() {
    setLoading(true);
    try {
      const { data } = await api.get('/items');
      setItems(data.items);
      setError('');
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to load items.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(); }, []);

  async function handleDelete() {
    setBusy(true);
    try {
      await api.delete(`/items/${deleteItem._id}`);
      setItems((current) => current.filter((item) => item._id !== deleteItem._id));
      setDeleteItem(null);
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to delete this item.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-wrap standard-page">
      <PageHeading eyebrow="Administration" title="Manage items" description="Review campus reports and update their status." />
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingSpinner label="Loading items" /> : items.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Item</th><th>Type</th><th>Reported by</th><th>Status</th><th>Reported</th><th>Actions</th></tr></thead><tbody>
        {items.map((item) => <tr key={item._id}><td><Link className="table-primary" to={`/items/${item._id}`}>{item.title}</Link><span className="table-secondary">{item.category} · {item.location}</span></td><td><span className={`type-badge ${item.type.toLowerCase()}`}>{item.type}</span></td><td>{item.reportedBy?.name || 'Campus member'}</td><td><StatusPill>{item.status}</StatusPill></td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td><div className="table-actions"><Link className="icon-button" to={`/items/${item._id}`} aria-label={`Open ${item.title}`} title="Open item"><ArrowRight size={16} /></Link><button className="icon-button danger-icon" type="button" aria-label={`Delete ${item.title}`} title="Delete item" onClick={() => setDeleteItem(item)}><X size={16} /></button></div></td></tr>)}
      </tbody></table></div> : <EmptyState icon={FileSearch} title="No items to manage" description="New reports will appear here." />}
      {deleteItem && <Modal title="Delete item report?" onClose={() => setDeleteItem(null)}><p className="modal-lede">This removes “{deleteItem.title}” from the directory.</p><div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setDeleteItem(null)}>Cancel</button><button className="button button-danger" type="button" onClick={handleDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete report'}</button></div></Modal>}
    </main>
  );
}

export function ManageClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyClaim, setBusyClaim] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/claims')
      .then(({ data }) => { if (active) setClaims(data.claims); })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load claims.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function decide(claim, decision) {
    setBusyClaim(claim._id);
    setError('');
    try {
      const { data } = await api.put(`/claims/${claim._id}/${decision}`);
      setClaims((current) => current.map((entry) => entry._id === claim._id ? data.claim : entry));
    } catch (requestError) {
      setError(getApiError(requestError, `Unable to ${decision} this claim.`));
    } finally {
      setBusyClaim('');
    }
  }

  async function handleDeleteClaim(claimId) {
    if (!window.confirm('Delete this claim? This will permanently remove it from the database.')) return;
    setBusyClaim(claimId);
    setError('');
    try {
      await api.delete(`/claims/${claimId}`);
      setClaims((current) => current.filter((entry) => entry._id !== claimId));
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to delete this claim.'));
    } finally {
      setBusyClaim('');
    }
  }

  const pendingCount = claims.filter((claim) => claim.status === 'Pending').length;
  return (
    <main className="page-wrap standard-page">
      <PageHeading eyebrow="Administration" title="Manage claims" description={`${pendingCount} ${pendingCount === 1 ? 'claim needs' : 'claims need'} review.`} />
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingSpinner label="Loading claims" /> : claims.length ? <div className="claim-list admin-claim-list">{claims.map((claim) => <article className="admin-claim-card" key={claim._id}>
        <div className="admin-claim-top"><div><span className="eyebrow">Claim for</span><h2>{claim.item?.title || 'Item no longer available'}</h2></div><StatusPill>{claim.status}</StatusPill></div>
        <div className="claimant-line"><InitialAvatar name={claim.claimant?.name} /><div><strong>{claim.claimant?.name || 'Campus member'}</strong><span>{claim.claimant?.email || 'No email available'} · {claim.claimant?.studentId || 'No student ID'}</span></div></div>
        <div className="claim-proof"><div><span>Message</span><p>{claim.message}</p></div><div><span>Proof description</span><p>{claim.proofDescription}</p></div></div>
        <div className="admin-claim-footer">
          <span>Submitted {new Date(claim.createdAt).toLocaleDateString()}</span>
          <div className="table-actions">
            <Link className="quiet-link" to={claim.item ? `/items/${claim.item._id}` : '/admin/items'}>View item <ArrowRight size={14} /></Link>
            {claim.status === 'Pending' && (
              <>
                <button className="button button-small button-secondary" type="button" onClick={() => decide(claim, 'reject')} disabled={busyClaim === claim._id}><X size={15} /> Reject</button>
                <button className="button button-small" type="button" onClick={() => decide(claim, 'approve')} disabled={busyClaim === claim._id}><Check size={15} /> Approve</button>
              </>
            )}
            <button className="button button-small button-secondary danger-icon" type="button" onClick={() => handleDeleteClaim(claim._id)} disabled={busyClaim === claim._id} title="Delete claim from database"><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      </article>)}</div> : <EmptyState icon={ClipboardList} title="No claims yet" description="Submitted claims will appear in this review queue." />}
    </main>
  );
}

export function ManageUsers() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/admin/users')
      .then(({ data }) => { if (active) setUsers(data.users); })
      .catch((requestError) => { if (active) setError(getApiError(requestError, 'Unable to load users.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`);
      setUsers((current) => current.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to delete this user.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleRole(targetUser) {
    const nextRole = targetUser.role === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Change ${targetUser.name}'s role to ${nextRole}?`)) return;
    try {
      await api.put(`/admin/users/${targetUser._id}/role`, { role: nextRole });
      setUsers((current) => current.map((u) => (u._id === targetUser._id ? { ...u, role: nextRole } : u)));
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to update user role.'));
    }
  }

  return (
    <main className="page-wrap standard-page">
      <PageHeading eyebrow="Administration" title="Manage users" description="Registered campus accounts and assigned roles." />
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? <LoadingSpinner label="Loading users" /> : users.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>User</th><th>Student ID</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
        {users.map((user) => <tr key={user._id}><td><div className="user-table-cell"><InitialAvatar name={user.name} /><div><span className="table-primary">{user.name}</span><span className="table-secondary">{user.email}</span></div></div></td><td>{user.studentId}</td><td><div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><span className={`role-label ${user.role}`}>{user.role}</span>{currentAdmin?.id !== user._id && <button className="chip" type="button" style={{ fontSize: '10px', padding: '2px 7px' }} onClick={() => handleToggleRole(user)} title={`Switch to ${user.role === 'admin' ? 'student' : 'admin'}`}>Make {user.role === 'admin' ? 'Student' : 'Admin'}</button>}</div></td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><div className="table-actions">{currentAdmin?.id !== user._id ? <button className="icon-button danger-icon" type="button" aria-label={`Delete ${user.name}`} title="Delete user" onClick={() => setDeleteTarget(user)}><Trash2 size={16} /></button> : <small style={{ color: '#888' }}>You</small>}</div></td></tr>)}
      </tbody></table></div> : <EmptyState icon={UsersRound} title="No users found" description="Registered accounts will appear here." />}
      {deleteTarget && (
        <Modal title="Delete user account?" onClose={() => setDeleteTarget(null)}>
          <p className="modal-lede">This permanently deletes <strong>{deleteTarget.name}</strong> ({deleteTarget.email}), all reports they submitted, and their claims from MongoDB.</p>
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="button button-danger" type="button" onClick={handleDeleteUser} disabled={busy}>{busy ? 'Deleting…' : 'Delete user'}</button>
          </div>
        </Modal>
      )}
    </main>
  );
}