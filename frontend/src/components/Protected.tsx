import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";

export function Protected({
  children,
  admin,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const token = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.user?.role);
  const loc = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }
  if (admin && role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  if (!admin && role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
