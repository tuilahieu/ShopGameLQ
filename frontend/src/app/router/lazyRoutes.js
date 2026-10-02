import { lazy } from "react";
import ClientLayoutScreen from "@/layouts/ClientLayout";
import HomeScreen from "@/pages/client/Home";
import AccountsScreen from "@/pages/client/Accounts";
import AccountDetailScreen from "@/pages/client/AccountDetail";
import LoginScreen from "@/pages/client/Login";
import RegisterScreen from "@/pages/client/Register";
import MyOrdersScreen from "@/pages/client/MyOrders";
import RechargeScreen from "@/pages/client/Recharge";
import ProfileScreen from "@/pages/client/Profile";
import TermsScreen from "@/pages/client/Terms";
import ContactScreen from "@/pages/client/Contact";
import NotFoundScreen from "@/pages/client/NotFound";

// Customer routes are deliberately part of the initial storefront bundle.
// Their data skeletons are the only page-level loading state customers see;
// admin and CTV screens remain lazy and retain the branded bundle fallback.
export const ClientLayout = ClientLayoutScreen;
export const Home = HomeScreen;
export const Accounts = AccountsScreen;
export const AccountDetail = AccountDetailScreen;
export const Login = LoginScreen;
export const Register = RegisterScreen;
export const MyOrders = MyOrdersScreen;
export const Recharge = RechargeScreen;
export const Profile = ProfileScreen;
export const Terms = TermsScreen;
export const Contact = ContactScreen;
export const NotFound = NotFoundScreen;

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
