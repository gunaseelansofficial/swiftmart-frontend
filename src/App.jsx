import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp, ShoppingBag } from 'lucide-react';
import LoadingSpinner from './components/shared/LoadingSpinner';
import { addNotification } from './store/slices/notificationsSlice';
import { useSocket } from './context/SocketContext';

// Pages
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
const NewOrdersPage = lazy(() => import('./pages/delivery/NewOrdersPage'));

// Customer Pages
const Home = lazy(() => import('./pages/customer/Home'));
const ProductListingPage = lazy(() => import('./pages/customer/ProductListingPage'));
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/customer/OrderSuccessPage'));
const OrderHistoryPage = lazy(() => import('./pages/customer/OrderHistoryPage'));
const TrackOrderPage = lazy(() => import('./pages/customer/TrackOrderPage'));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminOrders = lazy(() => import('./pages/admin/OrderManagement'));
const AdminPayments = lazy(() => import('./pages/admin/PaymentVerification'));
const AdminPartners = lazy(() => import('./pages/admin/DeliveryPartnerManagement'));
const AdminPartnerDetails = lazy(() => import('./pages/admin/PartnerDetails'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminBanners = lazy(() => import('./pages/admin/Banners'));
const AdminSettlementHistory = lazy(() => import('./pages/admin/SettlementHistoryPage'));

// Delivery Pages
const DeliveryDashboard = lazy(() => import('./pages/delivery/Dashboard'));
const ActiveOrderPage = lazy(() => import('./pages/delivery/ActiveOrderPage'));
const DeliveryOrders = lazy(() => import('./pages/delivery/DeliveryOrders'));
const DeliveryEarnings = lazy(() => import('./pages/delivery/EarningsPage'));

// Layouts
const DeliveryLayout = lazy(() => import('./layouts/DeliveryLayout'));

// Components
import PrivateRoute from './components/shared/PrivateRoute';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const toggle = () => setIsVisible(window.scrollY > 500);
    window.addEventListener('scroll', toggle);
    return () => window.removeEventListener('scroll', toggle);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-4 bg-brand-primary text-white rounded-full shadow-2xl hover:bg-brand-secondary transition-all"
        >
          <ChevronUp size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

import BottomNav from './components/shared/BottomNav';

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !isAuthenticated || !user) return;

    // 1. Join personal room for status updates (Customer & Partner)
    socket.emit('join', `user_${user._id}`);

    // 2. Join role-specific rooms
    if (user.role === 'admin') {
      socket.emit('admin:join');
    }
    if (user.role === 'delivery_partner') {
      socket.emit('partner:go_online_register', { partnerId: user._id });
    }

    // --- CUSTOMER / SHARED STATUS UPDATES ---
    const events = ['payment_verified', 'packed', 'assigned', 'picked_up', 'delivered'];
    events.forEach(status => {
      socket.on(`order:${status}`, (data) => {
        const message = data.message || `Order status updated to ${status}`;

        toast((t) => (
          <div className="flex flex-col items-start pt-2">
            <div className="flex items-center space-x-2 text-brand-primary font-bold">
              <ShoppingBag size={18} />
              <span>Update on Order #{data.orderId.slice(-6)}</span>
            </div>
            <p className="text-sm mt-1">{message}</p>
            <div className="flex mt-3 space-x-2">
              <Link
                to={user.role === 'customer' ? `/track/${data.orderId}` : `/delivery/active-order`}
                onClick={() => toast.dismiss(t.id)}
                className="text-xs bg-brand-primary text-white px-4 py-1.5 rounded-full font-bold shadow-lg shadow-brand-primary/20"
              >
                {user.role === 'customer' ? 'Track Order' : 'View Order'}
              </Link>
            </div>
          </div>
        ), { duration: 5000, icon: '📦' });

        dispatch(addNotification({
          title: `Order #${data.orderId.slice(-6)}`,
          message,
          orderId: data.orderId,
          status,
          type: 'status_update'
        }));
      });
    });

    // --- DELIVERY PARTNER: NEW REQUESTS ---
    if (user.role === 'delivery_partner') {
      socket.on('order:new_request', (data) => {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-[32px] pointer-events-auto flex flex-col overflow-hidden border-2 border-brand-primary`}>
            <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">New Order Request</p>
                <h3 className="text-xl font-black">₹{data.commission} Commission</h3>
              </div>
              <ShoppingBag size={32} />
            </div>
            <div className="p-6">
              <p className="text-sm font-bold text-gray-800">Order from {data.deliveryLocality}</p>
              <p className="text-xs text-gray-500 mt-1">{data.itemCount} Items • Pick up from Warehouse</p>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate('/delivery/new-orders');
                }}
                className="mt-4 w-full py-3 bg-brand-primary text-white font-black rounded-2xl uppercase text-[10px] tracking-widest"
              >
                Check Dashboard
              </button>
            </div>
          </div>
        ), { duration: 10000 });

        dispatch(addNotification({
          title: 'New Order Request',
          message: `Delivery to ${data.deliveryLocality} • Commission: ₹${data.commission}`,
          orderId: data._id,
          type: 'new_request',
          data: data
        }));
      });

      socket.on('order:request_expired', () => {
        dispatch(addNotification({
          title: 'Request Expired',
          message: 'That order was taken by another partner.',
          type: 'info'
        }));
      });
    }

    // --- ADMIN: NEW ORDERS ---
    if (user.role === 'admin') {
      socket.on('order:new', (order) => {
        toast.success(`New order placed! ID: #${order.orderId.slice(-6)}`);
        dispatch(addNotification({
          title: 'New Order Placed',
          message: `Order #${order.orderId.slice(-6)} from ${order.customer?.name}`,
          orderId: order._id,
          type: 'admin_new_order'
        }));
      });
    }

    return () => {
      socket.off('order:status_changed');
      socket.off('order:new');
      socket.off('order:new_request');
      socket.off('order:request_expired');
      const events = ['payment_verified', 'packed', 'assigned', 'picked_up', 'delivered'];
      events.forEach(e => socket.off(`order:${e}`));
    };
  }, [socket, isAuthenticated, user, dispatch, navigate]);

  // Check if current route is a customer route that should show BottomNav
  const isCustomerRoute = 
    !location.pathname.startsWith('/admin') && 
    !location.pathname.startsWith('/delivery') && 
    !location.pathname.startsWith('/login') && 
    !location.pathname.startsWith('/register');

  return (
    <div className={`app-container ${isCustomerRoute ? 'pb-[72px] md:pb-0' : ''}`}>
      <Toaster position="bottom-right" />
      <BackToTop />
      <Suspense fallback={<LoadingSpinner fullPage />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Auth Routes */}
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

            {/* Customer Routes */}
            <Route path="/" element={<PrivateRoute role="customer" requireAuth={false}><Home /></PrivateRoute>} />
            <Route path="/category/:slug" element={<PrivateRoute role="customer" requireAuth={false}><ProductListingPage /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute role="customer" requireAuth={false}><ProductListingPage /></PrivateRoute>} />
            <Route path="/product/:id" element={<PrivateRoute role="customer" requireAuth={false}><ProductDetailPage /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute role="customer" requireAuth={false}><CartPage /></PrivateRoute>} />
            <Route path="/checkout" element={<PrivateRoute role="customer"><CheckoutPage /></PrivateRoute>} />
            <Route path="/order-success/:orderId" element={<PrivateRoute role="customer"><OrderSuccessPage /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute role="customer"><OrderHistoryPage /></PrivateRoute>} />
            <Route path="/wishlist" element={<PrivateRoute role="customer"><WishlistPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute role="customer"><ProfilePage /></PrivateRoute>} />
            <Route path="/track/:orderId" element={<PrivateRoute role="customer"><TrackOrderPage /></PrivateRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/products" element={<PrivateRoute role="admin"><AdminProducts /></PrivateRoute>} />
            <Route path="/admin/categories" element={<PrivateRoute role="admin"><AdminCategories /></PrivateRoute>} />
            <Route path="/admin/orders" element={<PrivateRoute role="admin"><AdminOrders /></PrivateRoute>} />
            <Route path="/admin/payments" element={<PrivateRoute role="admin"><AdminPayments /></PrivateRoute>} />
            <Route path="/admin/delivery-partners" element={<PrivateRoute role="admin"><AdminPartners /></PrivateRoute>} />
            <Route path="/admin/delivery-partners/:id" element={<PrivateRoute role="admin"><AdminPartnerDetails /></PrivateRoute>} />
            <Route path="/admin/analytics" element={<PrivateRoute role="admin"><AdminAnalytics /></PrivateRoute>} />
            <Route path="/admin/banners" element={<PrivateRoute role="admin"><AdminBanners /></PrivateRoute>} />
            <Route path="/admin/daily-closing/history" element={<PrivateRoute role="admin"><AdminSettlementHistory /></PrivateRoute>} />

            {/* Delivery Routes */}
            <Route path="/delivery" element={<PrivateRoute role="delivery_partner"><DeliveryLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/delivery/dashboard" />} />
              <Route path="dashboard" element={<DeliveryDashboard />} />
              <Route path="new-orders" element={<NewOrdersPage />} />
              <Route path="active-order" element={<ActiveOrderPage />} />
              <Route path="orders" element={<DeliveryOrders />} />
              <Route path="earnings" element={<DeliveryEarnings />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Home />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      {isCustomerRoute && <BottomNav />}
    </div>
  );
}

export default App;
