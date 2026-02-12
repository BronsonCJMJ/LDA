import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: '◉' },
  { path: '/admin/news', label: 'News', icon: '◈' },
  { path: '/admin/tournaments', label: 'Tournaments', icon: '◆' },
  { path: '/admin/members', label: 'Members', icon: '◇' },
  { path: '/admin/gallery', label: 'Gallery', icon: '◻' },
  { path: '/admin/documents', label: 'Documents', icon: '◰' },
  { path: '/admin/forms', label: 'Form Submissions', icon: '◳' },
  { path: '/admin/settings', label: 'Site Settings', icon: '◎' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">LDA Admin</div>
          <div className="admin-user">{admin?.name}</div>
        </div>
        <nav className="admin-nav">
          {adminNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/" className="admin-nav-link" target="_blank" rel="noopener">View Site →</a>
          <button onClick={handleLogout} className="admin-logout-btn">Log Out</button>
        </div>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
