import { ProtectedAdminRoute } from "@/components/RouteGuards";
import AdminDashboard from "./AdminDashboard";

/**
 * AdminDashboardPage - Wraps AdminDashboard with admin-only access control
 * Only platform owner/admin can access this page
 */
export default function AdminDashboardPage() {
  return (
    <ProtectedAdminRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedAdminRoute>
  );
}
