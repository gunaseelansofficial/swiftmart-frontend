import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import io from 'socket.io-client';
import { useEffect } from 'react';
import {
    BarChart2,
    Package,
    ShoppingCart,
    Users,
    Truck,
    CreditCard,
    Settings,
    LogOut,
    Layers,
    Image as ImageIcon,
    Bell,
    Banknote
} from 'lucide-react';
import NotificationPopover from '../shared/NotificationPopover';

const AdminLayout = ({ children }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(state => state.auth);


    const menuItems = [
        { title: 'Overview', icon: <BarChart2 size={20} />, path: '/admin' },
        { title: 'Analytics', icon: <BarChart2 size={20} />, path: '/admin/analytics' },
        { title: 'Orders', icon: <ShoppingCart size={20} />, path: '/admin/orders' },
        { title: 'Products', icon: <Package size={20} />, path: '/admin/products' },
        { title: 'Categories', icon: <Layers size={20} />, path: '/admin/categories' },
        { title: 'Banners', icon: <ImageIcon size={20} />, path: '/admin/banners' },
        { title: 'Delivery Partners', icon: <Truck size={20} />, path: '/admin/delivery-partners' },
        { title: 'Daily Closing', icon: <Banknote size={20} />, path: '/admin/daily-closing' },
        { title: 'Payments', icon: <CreditCard size={20} />, path: '/admin/payments' },
        { title: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
    ];

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-dark-bg text-white flex flex-col shadow-xl">
                <div className="p-6 border-b border-white/10">
                    <Link to="/" className="flex flex-col">
                        <span className="text-2xl font-heading font-extrabold text-brand-primary leading-none">SWIFTMART</span>
                        <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em]">ADMIN PORTAL</span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${location.pathname === item.path
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.title}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-8">
                    <h2 className="text-xl font-heading font-extrabold text-gray-800">
                        {menuItems.find(item => item.path === location.pathname)?.title || 'Dashboard'}
                    </h2>
                    <div className="flex items-center space-x-6">
                        <NotificationPopover />

                        <div className="flex items-center">
                            <div className="text-right mr-4 hidden sm:block">
                                <p className="text-xs font-bold text-gray-400 uppercase leading-none">Logged in as</p>
                                <p className="text-sm font-bold text-gray-800">Admin User</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
