import { NavLink } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import ganeshIcon from "../assets/ganesh-icon.svg";

const links = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/add-member", label: "Add Member Form", icon: "➕" },
  { to: "/add-expense", label: "Expenses Form", icon: "🧾" },
  { to: "/members", label: "All Member Details", icon: "👥" },
  { to: "/expenses", label: "All Expenses Details", icon: "📁" },
];

export default function Sidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={close} />}
      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <img src={ganeshIcon} alt="Bal Ganesh Mitra Mandal" className="brand-logo" />
          <h2>Bal Ganesh Mitra Mandal</h2>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={close}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
