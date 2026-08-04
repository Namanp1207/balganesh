import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddMember from "./pages/AddMember";
import AddExpense from "./pages/AddExpense";
import MemberDetails from "./pages/MemberDetails";
import ExpenseDetails from "./pages/ExpenseDetails";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <SidebarProvider>
                    <Layout />
                  </SidebarProvider>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/add-member" element={<AddMember />} />
                <Route path="/add-expense" element={<AddExpense />} />
                <Route path="/members" element={<MemberDetails />} />
                <Route path="/expenses" element={<ExpenseDetails />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
