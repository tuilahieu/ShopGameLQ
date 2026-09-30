import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLoader from "@/components/AppLoader";
import NetworkActivity from "@/components/NetworkActivity";
import ScrollToTop from "@/components/ScrollToTop";
import { AdminGuard, CtvGuard } from "@/app/router/guards";
import * as Screens from "@/app/router/lazyRoutes";

function ClientRoutes() {
  return (
    <Route element={<Screens.ClientLayout />}>
      <Route path="/" element={<Screens.Home />} />
      <Route path="/accounts" element={<Screens.Accounts />} />
      <Route path="/account/:id" element={<Screens.AccountDetail />} />
      <Route path="/login" element={<Screens.Login />} />
      <Route path="/register" element={<Screens.Register />} />
      <Route path="/my-orders" element={<Screens.MyOrders />} />
      <Route path="/nap-tien" element={<Screens.Recharge />} />
      <Route path="/profile" element={<Screens.Profile />} />
      <Route path="/terms" element={<Screens.Terms />} />
      <Route path="/contact" element={<Screens.Contact />} />
      <Route path="*" element={<Screens.NotFound />} />
    </Route>
  );
}

function AdminRoutes() {
  return (
    <>
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route
        path="/admin"
        element={(
          <AdminGuard>
            <Screens.AdminGate><Screens.AdminLayout /></Screens.AdminGate>
          </AdminGuard>
        )}
      >
        <Route index element={<Screens.AdminDashboard />} />
        <Route path="users" element={<Screens.AdminUsers />} />
        <Route path="accounts" element={<Screens.AdminAccounts />} />
        <Route path="orders" element={<Screens.AdminOrders />} />
        <Route path="transactions" element={<Screens.AdminTransactions />} />
        <Route path="sales" element={<Screens.AdminSales />} />
        <Route path="discounts" element={<Screens.AdminDiscounts />} />
        <Route path="setting" element={<Screens.AdminSetting />} />
        <Route path="logs" element={<Screens.AdminLogs />} />
        <Route path="categories" element={<Screens.AdminCategories />} />
        <Route path="account-types" element={<Screens.AdminAccountTypes />} />
        <Route path="banks" element={<Screens.AdminBanks />} />
      </Route>
    </>
  );
}

function CtvRoutes() {
  return (
    <Route
      path="/ctv"
      element={<CtvGuard><Screens.CtvLayout /></CtvGuard>}
    >
      <Route index element={<Screens.CtvDashboard />} />
      <Route path="accounts" element={<Screens.CtvAccounts />} />
      <Route path="orders" element={<Screens.CtvOrders />} />
    </Route>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <NetworkActivity />
      <Suspense fallback={<AppLoader />}>
        <Routes>
          {ClientRoutes()}
          {AdminRoutes()}
          {CtvRoutes()}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
