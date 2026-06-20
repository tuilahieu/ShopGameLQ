import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

import ClientLayout from "./layouts/ClientLayout";
import Home from "./pages/client/Home";
import Accounts from "./pages/client/Accounts";
import AccountDetail from "./pages/client/AccountDetail";
import Login from "./pages/client/Login";
import Register from "./pages/client/Register";
import MyOrders from "./pages/client/MyOrders";
import Recharge from "./pages/client/Recharge";
import Profile from "./pages/client/Profile";
import Terms from "./pages/client/Terms";
import Contact from "./pages/client/Contact";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAccounts from "./pages/admin/AdminAccounts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminSales from "./pages/admin/AdminSales";
import AdminDiscounts from "./pages/admin/AdminDiscounts";
import AdminSetting from "./pages/admin/AdminSetting";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAccountTypes from "./pages/admin/AdminAccountTypes";
import AdminBanks from "./pages/admin/AdminBanks";

import CtvLayout from "./layouts/CtvLayout";
import CtvDashboard from "./pages/ctv/CtvDashboard";
import CtvAccounts from "./pages/ctv/CtvAccounts";
import CtvOrders from "./pages/ctv/CtvOrders";

import { ThemeProvider } from "./context/ThemeContext";

function AdminProtected({ children }) {
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (Number(user.level) !== 99) return <Navigate to="/" replace />;

  return children;
}

function CtvProtected({ children }) {
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (Number(user.level) !== 1 && Number(user.level) !== 99) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<ClientLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/account/:id" element={<AccountDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/nap-tien" element={<Recharge />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        <Route
          path="/admin"
          element={
            <AdminProtected>
              <AdminLayout />
            </AdminProtected>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="sales" element={<AdminSales />} />
          <Route path="discounts" element={<AdminDiscounts />} />
          <Route path="setting" element={<AdminSetting />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="account-types" element={<AdminAccountTypes />} />
          <Route path="banks" element={<AdminBanks />} />
        </Route>

        <Route
          path="/ctv"
          element={
            <CtvProtected>
              <CtvLayout />
            </CtvProtected>
          }
        >
          <Route index element={<CtvDashboard />} />
          <Route path="accounts" element={<CtvAccounts />} />
          <Route path="orders" element={<CtvOrders />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

