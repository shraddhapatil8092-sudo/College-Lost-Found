import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { AdminRoute, Footer, Navbar, ProtectedRoute } from './components/index.jsx';
import { About, Home, Login, Register } from './pages/PublicPages.jsx';
import {
  BrowseItems,
  Dashboard,
  ItemDetails,
  MyClaims,
  MyReports,
  Profile,
  ReportItem,
} from './pages/StudentPages.jsx';
import {
  AdminDashboard,
  ManageClaims,
  ManageItems,
  ManageUsers,
} from './pages/AdminPages.jsx';

function SiteLayout() {
  return (
    <div className="site-frame">
      <Navbar />
      <div className="site-content"><Outlet /></div>
      <Footer />
    </div>
  );
}

function DefaultRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/items" element={<BrowseItems />} />
          <Route path="/items/lost" element={<BrowseItems type="Lost" />} />
          <Route path="/items/found" element={<BrowseItems type="Found" />} />
          <Route path="/items/new/lost" element={<ReportItem type="Lost" />} />
          <Route path="/items/new/found" element={<ReportItem type="Found" />} />
          <Route path="/items/:id" element={<ItemDetails />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/my-claims" element={<MyClaims />} />
          <Route path="/profile" element={<Profile />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/items" element={<ManageItems />} />
            <Route path="/admin/claims" element={<ManageClaims />} />
          </Route>
        </Route>
        <Route path="/account" element={<DefaultRedirect />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default App;