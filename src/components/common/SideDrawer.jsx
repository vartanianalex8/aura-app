import { useNavigate } from 'react-router-dom';
import { X, BookmarkIcon, FileText, HelpCircle, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import './SideDrawer.css';

const MENU_ITEMS = [
  { icon: BookmarkIcon, label: 'Saved Posts', route: '/saved' },
  { icon: Settings, label: 'Settings', route: ROUTES.SETTINGS },
  { icon: FileText, label: 'Patch Notes', route: ROUTES.CHANGELOG },
  { icon: HelpCircle, label: 'Help Center', route: '/help' },
];

export default function SideDrawer({ open, onClose }) {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  const handleNav = (route) => {
    navigate(route);
    onClose();
  };

  const handleLogout = async () => {
    await logOut();
    onClose();
  };

  return (
    <>
      <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`side-drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-user">
            <div className="drawer-avatar">
              {user?.profilePicture?.url ? (
                <img src={user.profilePicture.url} alt="" />
              ) : (
                <div className="drawer-avatar-ph" />
              )}
            </div>
            <div>
              <p className="drawer-username">@{user?.username}</p>
              <p className="drawer-streak">🔥 {user?.streakCount || 0} day streak</p>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="drawer-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.route}
              className="drawer-item"
              onClick={() => handleNav(item.route)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="drawer-footer">
          <button className="drawer-logout" onClick={handleLogout}>
            Log Out
          </button>
          <span className="drawer-version">Aura v1.5.0</span>
        </div>
      </aside>
    </>
  );
}
