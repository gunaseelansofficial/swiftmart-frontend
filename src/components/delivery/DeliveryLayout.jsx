import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
    BarChart2,
    Map,
    History,
    Wallet,
    User,
    LogOut,
    Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

const DeliveryLayout = ({ children }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(state => state.auth);

    const menuItems = [
        { title: 'Dashboard', icon: <BarChart2 size={24} />, path: '/delivery' },
        { title: 'Active Order', icon: <Map size={24} />, path: '/delivery/active' },
        { title: 'Histroy', icon: <History size={24} />, path: '/delivery/orders' },
        { title: 'Earnings', icon: <Wallet size={24} />, path: '/delivery/earnings' },
        { title: 'Profile', icon: <User size={24} />, path: '/delivery/profile' },
    ];

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
            {/* Mobile Header */}
            <header className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-40">
                <div>
                    <h1 className="text-xl font-heading font-extrabold text-brand-primary">SWIFTMART</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Partner Portal</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Bell size={24} className="text-gray-400" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold">2</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold shadow-md">
                        {user?.name?.charAt(0)}
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-6">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 h-20 flex items-center justify-around px-2 z-40 ring-1 ring-black/5">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center justify-center space-y-1 transition-all px-4 py-2 rounded-xl ${location.pathname === item.path
                                ? 'text-brand-primary'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            animate={location.pathname === item.path ? { y: -2 } : {}}
                        >
                            {item.icon}
                        </motion.div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.title}</span>
                    </button>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center space-y-1 text-gray-400 hover:text-red-500 px-4 py-2"
                >
                    <LogOut size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Logout</span>
                </button>
            </nav>
        </div>
    );
};

export default DeliveryLayout;
