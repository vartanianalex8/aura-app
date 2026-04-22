import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Search, User, Menu } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import './BottomNav.css';

export default function BottomNav({ onMenuOpen }) {
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
      <NavLink to={ROUTES.PROFILE} className="nav-item">
        <User size={22} />
        <span>Profile</span>
      </NavLink>
      <button className="nav-item nav-item--menu" onClick={onMenuOpen}>
        <Menu size={22} />
        <span>More</span>
      </button>
    </nav>
  );
}
