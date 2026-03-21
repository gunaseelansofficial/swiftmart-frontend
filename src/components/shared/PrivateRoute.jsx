import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * role: The required role for this route ('admin', 'delivery_partner', 'customer')
 * requireAuth: If true, unauthenticated users will be redirected to /login
 */
const PrivateRoute = ({ children, role, requireAuth = true }) => {
    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    // 1. Role-based redirection for authenticated users who are in the WRONG place
    if (isAuthenticated) {
        // If they are a non-customer role but on a customer-targeted page
        if (role === 'customer') {
            if (user?.role === 'delivery_partner') return <Navigate to="/delivery/dashboard" />;
            if (user?.role === 'admin') return <Navigate to="/admin" />;
        }

        // Specific role check for authenticated routes (admin/partner)
        if (role && role !== 'customer' && user?.role !== role) {
            if (user?.role === 'delivery_partner') return <Navigate to="/delivery/dashboard" />;
            if (user?.role === 'admin') return <Navigate to="/admin" />;
            return <Navigate to="/" />;
        }
    } else {
        // 2. Unauthenticated users
        if (requireAuth) {
            return <Navigate to="/login" />;
        }
    }

    // If we get here, they are either guest on public page, or auth on correct page
    return children;
};

export default PrivateRoute;
