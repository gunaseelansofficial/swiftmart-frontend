import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, History, IndianRupee, User as UserIcon, Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import NotificationPopover from '../components/shared/NotificationPopover';

const DeliveryLayout = () => {
    const { user } = useSelector((state) => state.auth);

    const navItems = [
        { label: 'Dashboard', icon: <LayoutDashboard size={24} />, path: '/delivery/dashboard' },
        { label: 'New', icon: <Bell size={24} />, path: '/delivery/new-orders' },
        { label: 'Active', icon: <ShoppingBag size={24} />, path: '/delivery/active-order' },
        { label: 'History', icon: <History size={24} />, path: '/delivery/orders' },
        { label: 'Earnings', icon: <IndianRupee size={24} />, path: '/delivery/earnings' },
    ];

    return (
        <div className="min-h-screen bg-[#0D1B2A] text-white pb-20">
            {/* Header */}
            <header className="bg-[#1B263B] p-4 flex items-center justify-between sticky top-0 z-40 shadow-lg border-b border-gray-700">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <UserIcon className="text-brand-primary" size={20} />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
                        <div className="flex items-center space-x-1">
                            <span className={`w-2 h-2 rounded-full ${user?.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                {user?.isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <NotificationPopover color="text-white" />
                    <h1 className="text-brand-primary font-black tracking-tighter text-xl">SWIFTMART</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 max-w-lg mx-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#1B263B] border-t border-gray-700 px-6 py-2 flex justify-between items-center z-50">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center space-y-1 transition-all ${isActive ? 'text-brand-primary' : 'text-gray-400 hover:text-white'
                            }`
                        }
                    >
                        {item.icon}
                        <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default DeliveryLayout;
