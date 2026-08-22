import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./context/ThemeContext";
import AppLoader from "./components/AppLoader";

// Keep the first bundle limited to routing, theme and the loading shell. Each
// page is fetched only when its route is needed, especially admin screens that
// should never affect a customer's initial mobile load.
const ClientLayout = lazy(() => import("./layouts/ClientLayout"));
const Home = lazy(() => import("./pages/client/Home"));
const Accounts = lazy(() => import("./pages/client/Accounts"));
const AccountDetail = lazy(() => import("./pages/client/AccountDetail"));
const Login = lazy(() => import("./pages/client/Login"));
const Register = lazy(() => import("./pages/client/Register"));
const MyOrders = lazy(() => import("./pages/client/MyOrders"));
const Recharge = lazy(() => import("./pages/client/Recharge"));
const Profile = lazy(() => import("./pages/client/Profile"));
const Terms = lazy(() => import("./pages/client/Terms"));
const Contact = lazy(() => import("./pages/client/Contact"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAccounts = lazy(() => import("./pages/admin/AdminAccounts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminSales = lazy(() => import("./pages/admin/AdminSales"));
const AdminDiscounts = lazy(() => import("./pages/admin/AdminDiscounts"));
const AdminSetting = lazy(() => import("./pages/admin/AdminSetting"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminAccountTypes = lazy(() => import("./pages/admin/AdminAccountTypes"));
const AdminBanks = lazy(() => import("./pages/admin/AdminBanks"));

const CtvLayout = lazy(() => import("./layouts/CtvLayout"));
const CtvDashboard = lazy(() => import("./pages/ctv/CtvDashboard"));
const CtvAccounts = lazy(() => import("./pages/ctv/CtvAccounts"));
const CtvOrders = lazy(() => import("./pages/ctv/CtvOrders"));

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
        <Suspense fallback={<AppLoader />}>
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
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
