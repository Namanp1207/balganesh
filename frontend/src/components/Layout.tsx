import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
