import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { markAsRead, markAllAsRead } from '../../store/slices/notificationsSlice';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const NotificationPopover = ({ color = 'text-gray-500' }) => {
    const { notifications, unreadCount } = useSelector(state => state.notifications);
    const { user } = useSelector(state => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const socket = useSocket();

    useEffect(() => {
        // No local socket initialization needed, handled by useSocket()
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (n) => {
        dispatch(markAsRead(n.id));
        setIsOpen(false);

        if (n.type === 'new_request' || n.type === 'status_update') {
            if (user?.role === 'delivery_partner') {
                if (n.type === 'new_request') {
                    navigate('/delivery/new-orders');
                } else {
                    navigate('/delivery/dashboard');
                }
            } else if (user?.role === 'customer') {
                navigate(`/track/${n.orderId}`);
            }
        } else if (n.type === 'admin_new_order') {
            navigate('/admin/orders');
        }
    };

    const handleAcceptOrder = (n) => {
        if (!socket) return;
        socket.emit('order:accept', { orderId: n.orderId, partnerId: user._id });

        // Listen for confirmation
        socket.once('order:accept_confirmed', () => {
            dispatch(markAsRead(n.id));
            setIsOpen(false);
            navigate('/delivery/active-order');
            toast.success('Order Accepted!');
        });

        socket.once('order:already_taken', ({ message }) => {
            toast.error(message);
            dispatch(markAsRead(n.id));
            setIsOpen(false);
        });
    };

    const handleDeclineOrder = (n) => {
        if (!socket) return;
        socket.emit('order:decline', { orderId: n.orderId, partnerId: user._id });
        dispatch(markAsRead(n.id));
        setIsOpen(false);
        toast.success('Order declined');
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 transition-colors relative hover:text-brand-primary ${color}`}
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-coral-accent text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#1B263B]">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-4 w-80 bg-white dark:bg-dark-bg rounded-[24px] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-[100]"
                    >
                        <div className="p-4 border-b border-gray-50 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-800 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => dispatch(markAllAsRead())}
                                    className="text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-start space-x-3 ${!n.read ? 'bg-brand-primary/5' : ''}`}
                                    >
                                        <div className={`mt-1 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                            <ShoppingBag size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">{n.title}</p>
                                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{n.message}</p>

                                            {n.type === 'new_request' && !n.read && (
                                                <div className="mt-4 grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAcceptOrder(n);
                                                        }}
                                                        className="py-2.5 bg-brand-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-primary/20 flex items-center justify-center space-x-1"
                                                    >
                                                        <Check size={12} />
                                                        <span>Accept</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeclineOrder(n);
                                                        }}
                                                        className="py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center space-x-1"
                                                    >
                                                        <X size={12} />
                                                        <span>Ignore</span>
                                                    </button>
                                                </div>
                                            )}

                                            {n.type === 'new_request' && n.read && (
                                                <p className="mt-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Handled</p>
                                            )}

                                            <p className="text-[9px] text-gray-400 mt-2 uppercase font-bold">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!n.read && <div className="w-2 h-2 rounded-full bg-brand-primary mt-2"></div>}
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center">
                                    <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <Bell size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No new updates</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationPopover;
