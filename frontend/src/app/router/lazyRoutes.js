import { lazy } from "react";

export const ClientLayout = lazy(() => import("@/layouts/ClientLayout"));
export const Home = lazy(() => import("@/pages/client/Home"));
export const Accounts = lazy(() => import("@/pages/client/Accounts"));
export const AccountDetail = lazy(() => import("@/pages/client/AccountDetail"));
export const Login = lazy(() => import("@/pages/client/Login"));
export const Register = lazy(() => import("@/pages/client/Register"));
export const MyOrders = lazy(() => import("@/pages/client/MyOrders"));
export const Recharge = lazy(() => import("@/pages/client/Recharge"));
export const Profile = lazy(() => import("@/pages/client/Profile"));
export const Terms = lazy(() => import("@/pages/client/Terms"));
export const Contact = lazy(() => import("@/pages/client/Contact"));
export const NotFound = lazy(() => import("@/pages/client/NotFound"));

export const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
export const AdminGate = lazy(() => import("@/pages/admin/AdminGate"));
export const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
export const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
export const AdminAccounts = lazy(() => import("@/pages/admin/AdminAccounts"));
export const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
export const AdminTransactions = lazy(() => import("@/pages/admin/AdminTransactions"));
export const AdminSales = lazy(() => import("@/pages/admin/AdminSales"));
export const AdminDiscounts = lazy(() => import("@/pages/admin/AdminDiscounts"));
export const AdminSetting = lazy(() => import("@/pages/admin/AdminSetting"));
export const AdminLogs = lazy(() => import("@/pages/admin/AdminLogs"));
export const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
export const AdminAccountTypes = lazy(() => import("@/pages/admin/AdminAccountTypes"));
export const AdminBanks = lazy(() => import("@/pages/admin/AdminBanks"));

export const CtvLayout = lazy(() => import("@/layouts/CtvLayout"));
export const CtvDashboard = lazy(() => import("@/pages/ctv/CtvDashboard"));
export const CtvAccounts = lazy(() => import("@/pages/ctv/CtvAccounts"));
export const CtvOrders = lazy(() => import("@/pages/ctv/CtvOrders"));
