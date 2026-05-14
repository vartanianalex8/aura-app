import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Search, User, Bell } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { notificationService } from '../services/notifications';
import './BottomNav.css';

export default function BottomNav({ onMenuOpen }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkUnread = async () => {
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  };

  return (
    <nav className="bottom-nav">
      <NavLink to={ROUTES.HOME} className="nav-item" end>
        <Home size={22} />
        <span>Home</span>
      </NavLink>
      <NavLink to={ROUTES.SEARCH} className="nav-item">
        <Search size={22} />
        <span>Search</span>
      </NavLink>
      <NavLink to={ROUTES.POST} className="nav-item nav-item--post">
        <div className="post-btn">
          <PlusCircle size={28} />
        </div>
      </NavLink>
      <NavLink to="/notifications" className="nav-item">
        <div className="nav-bell-wrap">
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </div>
        <span>Alerts</span>
      </NavLink>
      <NavLink to={ROUTES.PROFILE} className="nav-item">
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
