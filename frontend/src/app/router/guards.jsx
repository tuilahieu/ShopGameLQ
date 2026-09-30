import { Navigate } from "react-router-dom";
import { readStoredJson } from "@/utils/storage";

function getSession() {
  return {
    token: localStorage.getItem("accessToken"),
    user: readStoredJson("user", {}),
  };
}

export function AdminGuard({ children }) {
  const { token, user } = getSession();
  if (!token) return <Navigate to="/login" replace />;
  if (Number(user.level) !== 99) return <Navigate to="/" replace />;
  return children;
}

export function CtvGuard({ children }) {
  const { token, user } = getSession();
  const level = Number(user.level);
  if (!token) return <Navigate to="/login" replace />;
  if (level !== 1 && level !== 99) return <Navigate to="/" replace />;
  return children;
}
