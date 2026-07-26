import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";

export default function Navbar() {
  const { logout } = useAuth();
  const { toggle } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <button className="hamburger-btn" onClick={toggle} aria-label="Toggle menu">
          ☰
        </button>
        <div className="nav-title">Bal Ganesh Mitra Mandal</div>
      </div>
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}
