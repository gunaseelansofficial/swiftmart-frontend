import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    IndianRupee,
    Calendar,
    TrendingUp,
    CheckCircle2,
    MapPin,
    Navigation,
    Clock,
    X,
    User as UserIcon,
    LogOut,
    Power
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { logout, setUser } from '../../store/slices/authSlice';
import { useSocket } from '../../context/SocketContext';

const DeliveryDashboard = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isOnline, setIsOnline] = useState(user?.isOnline || false);
    const [stats, setStats] = useState({
        todayOrders: 0,
        todayEarnings: 0,
        monthEarnings: 0,
        totalEarned: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [incomingOrder, setIncomingOrder] = useState(null);
    const [countdown, setCountdown] = useState(20);
    const [loading, setLoading] = useState(true);

    const socket = useSocket();
    const timerRef = useRef(null);

    useEffect(() => {
        fetchDashboardData();
        fetchOnlineStatus();

        if (socket) {
            setupSocketListeners();
        }

        return () => {
            if (socket) cleanupSocketListeners();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [socket]);

    const fetchOnlineStatus = async () => {
        try {
            const { data } = await api.get('/delivery/status');
            setIsOnline(data.isOnline);
            // If already online in DB, also re-emit go_online to update server map
            if (data.isOnline && socket) {
                socket.emit('partner:go_online', { partnerId: user._id });
            }
        } catch (error) {
            console.error('Failed to fetch status');
        }
    };

    useEffect(() => {
        // This useEffect was previously using socketRef.current to re-register.
        // With the global socket from context, the initial setupSocketListeners
        // and fetchOnlineStatus (which emits go_online if already online)
        // should handle the initial state.
        // If there's a specific need to re-register on user ID change,
        // it should be handled here using the global socket.
        // For now, removing the explicit re-registration as it's covered by initial setup.
        // The instruction implies removing socketRef related logic.
    }, [user?._id]);

    const cleanupSocketListeners = () => {
        if (!socket) return;
        socket.off('order:new_request');
        socket.off('order:request_expired');
        socket.off('order:accept_confirmed');
        socket.off('order:already_taken');
        socket.off('order:cancelled'); // Added cleanup for cancelled listener
    };

    const setupSocketListeners = () => {
        if (!socket) return;

        // New order request comes in
        socket.on('order:new_request', (data) => {
            setIncomingOrder(data);
            setCountdown(20);
            // play notification sound
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { });
        });

        // Order was taken by someone else — dismiss modal silently
        socket.on('order:request_expired', ({ orderId }) => {
            setIncomingOrder(prev => {
                if (prev?._id === orderId) {
                    toast('Order was assigned to another partner', { icon: 'ℹ️' });
                    return null;
                }
                return prev;
            });
        });

        // Server confirms we got the order
        socket.on('order:accept_confirmed', ({ order }) => {
            setIncomingOrder(null);
            fetchDashboardData(); // Refresh data after order acceptance
            navigate('/delivery/active-order');
        });

        // If partner accepted but order already taken
        socket.on('order:already_taken', ({ message }) => {
            setIncomingOrder(null);
            toast.error(message);
        });

        socket.on('order:cancelled', (data) => {
            setIncomingOrder(prev => {
                if (prev?._id === data.orderId) {
                    toast.error('Order was cancelled');
                    return null;
                }
                return prev;
            });
        });
    };

    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => { });
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, ordersRes] = await Promise.all([
                api.get('/delivery/stats'),
                api.get('/delivery/orders?limit=5')
            ]);
            setStats(statsRes.data.stats);
            setRecentOrders(ordersRes.data.orders);
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!incomingOrder) return;
        if (countdown === 0) {
            // Auto decline
            handleDeclineOrder(); // Changed to new function name
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, incomingOrder]);

    const handleToggleStatus = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus); // optimistic update

        try {
            const { data } = await api.patch('/delivery/toggle-status', { isOnline: newStatus });

            // Sync to Redux store so the navbar reflects the real state
            dispatch(setUser({ ...user, isOnline: data.isOnline }));

            if (data.isOnline) {
                // Going online — register in activePartners map
                socket?.emit('partner:go_online', { partnerId: user._id });
                toast.success('You are now Online 🟢');
            } else {
                // Going offline — remove from activePartners map
                socket?.emit('partner:go_offline', { partnerId: user._id });
                toast('You are now Offline ⚫');
            }
        } catch (error) {
            // Revert optimistic update on error
            setIsOnline(!newStatus);
            toast.error('Failed to update status');
        }
    };

    const handleAcceptOrder = () => {
        if (!incomingOrder || !socket) return;
        socket.emit('order:accept', { orderId: incomingOrder._id, partnerId: user._id });
    };

    const handleDeclineOrder = () => {
        if (!incomingOrder || !socket) return;
        // Tell server to ignore for this partner
        socket.emit('order:decline', { orderId: incomingOrder._id, partnerId: user._id });
        setIncomingOrder(null);
        toast.error('Order declined');
    };

    const StatCard = ({ title, value, icon, color }) => (
        <div className="bg-[#1B263B] p-4 rounded-2xl border border-gray-700 flex flex-col items-center justify-center text-center">
            <div className={`p-2 rounded-lg ${color} mb-2`}>
                {icon}
            </div>
            <p className="text-xl font-black text-white">{value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Top Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white leading-tight">Good morning,</h2>
                    <p className="text-gray-400 font-bold">{user?.name} 👋</p>
                </div>
                <button
                    onClick={() => dispatch(logout())}
                    className="p-3 bg-[#1B263B] rounded-xl text-coral-accent border border-gray-700"
                >
                    <LogOut size={20} />
                </button>
            </div>

            {/* Online/Offline Toggle */}
            <div className={`p-6 rounded-3xl border transition-all duration-500 ${isOnline
                ? 'bg-[#1B263B] border-brand-primary'
                : 'bg-gray-800/50 border-gray-700'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                            <h3 className={`text-sm font-black uppercase tracking-widest ${isOnline ? 'text-white' : 'text-gray-500'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </h3>
                        </div>
                        <p className="text-xs text-gray-400 font-bold">
                            {isOnline ? 'Waiting for new orders...' : 'Go online to start earning'}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleStatus}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-500 relative ${isOnline ? 'bg-brand-primary' : 'bg-gray-600'
                            }`}
                    >
                        <motion.div
                            animate={{ x: isOnline ? 24 : 0 }}
                            className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                        >
                            <Power size={12} className={isOnline ? 'text-brand-primary' : 'text-gray-400'} />
                        </motion.div>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    title="Today's Orders"
                    value={stats.todayOrders}
                    icon={<ShoppingBag size={20} className="text-[#FF7F50]" />}
                    color="bg-[#FF7F50]/10"
                />
                <StatCard
                    title="Today's Earnings"
                    value={`₹${Math.round(stats.todayEarnings)}`}
                    icon={<IndianRupee size={20} className="text-[#4CAF50]" />}
                    color="bg-green-500/10"
                />
                <StatCard
                    title="This Month"
                    value={`₹${Math.round(stats.monthEarnings)}`}
                    icon={<Calendar size={20} className="text-[#2196F3]" />}
                    color="bg-blue-500/10"
                />
                <StatCard
                    title="Total Earned"
                    value={`₹${Math.round(stats.totalEarned)}`}
                    icon={<TrendingUp size={20} className="text-[#E91E63]" />}
                    color="bg-pink-500/10"
                />
            </div>

            {/* Recent Orders Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Recent Completed Orders</h3>
                    <button
                        onClick={() => navigate('/delivery/orders')}
                        className="text-brand-primary text-[10px] font-black uppercase tracking-widest"
                    >
                        View All
                    </button>
                </div>

                <div className="space-y-3">
                    {recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                            <div key={order._id} className="bg-[#1B263B] p-4 rounded-2xl border border-gray-700 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white uppercase tracking-tight">#{order.orderId.slice(-6)}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(order.updatedAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-brand-primary">+₹{Math.round(order.totalAmount * 0.15)}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Commission</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500 italic text-sm">
                            No recent completed orders
                        </div>
                    )}
                </div>
            </div>

            {/* Incoming Order Modal */}
            <AnimatePresence>
                {incomingOrder && (
                    <div className="fixed inset-0 z-[200] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-[#1B263B] rounded-t-[40px] overflow-hidden p-8 border-t border-gray-700"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-brand-primary text-xs font-black uppercase tracking-widest mb-2">New Delivery Request</p>
                                    <h2 className="text-5xl font-black text-white tracking-tighter">₹{incomingOrder.commission}</h2>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">You earn from this order</p>
                                </div>
                                <div className="p-4 bg-coral-accent/20 rounded-2xl text-coral-accent border border-coral-accent/30 flex flex-col items-center min-w-[70px]">
                                    <Clock size={20} className="mb-1" />
                                    <span className="text-lg font-black">{countdown}s</span>
                                </div>
                            </div>

                            <div className="space-y-6 mb-8">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-400 shrink-0 border border-gray-700">
                                        <Navigation size={24} />
                                    </div>
                                    <div className="flex-1 border-b border-gray-800 pb-4">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pickup Store</p>
                                        <p className="text-lg font-bold text-white leading-tight">SwiftMart Superstore</p>
                                        <p className="text-xs text-gray-400">{incomingOrder.pickupAddress}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-coral-accent/10 flex items-center justify-center text-coral-accent shrink-0 border border-coral-accent/20">
                                        <MapPin size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Delivery Locality</p>
                                        <p className="text-lg font-bold text-white leading-tight">{incomingOrder.deliveryLocality}</p>
                                        <p className="text-xs text-brand-primary font-bold mt-1">
                                            {incomingOrder.itemCount} Items • ₹{Math.round(incomingOrder.totalAmount)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={handleDeclineOrder}
                                    className="flex-1 py-5 rounded-2xl bg-gray-800 text-gray-400 font-black uppercase tracking-widest text-xs hover:bg-gray-700 transition-colors"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={handleAcceptOrder}
                                    className="flex-[2] py-5 rounded-2xl bg-brand-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Accept Order
                                </button>
                            </div>

                            {/* Progress bar countdown */}
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
                                <motion.div
                                    initial={{ width: "100%" }}
                                    animate={{ width: 0 }}
                                    transition={{ duration: 20, ease: "linear" }}
                                    className="h-full bg-coral-accent"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveryDashboard;
