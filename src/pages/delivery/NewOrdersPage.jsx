import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    MapPin,
    Clock,
    ArrowRight,
    IndianRupee,
    Package,
    Navigation,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

const NewOrdersPage = () => {
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const [availableOrders, setAvailableOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState(null);
    const socket = useSocket();

    useEffect(() => {
        fetchAvailableOrders();

        if (socket) setupSocketListeners();

        return () => {
            if (socket) cleanupSocketListeners();
        };
    }, [socket]);

    const cleanupSocketListeners = () => {
        if (!socket) return;
        socket.off('order:new_request');
        socket.off('order:request_expired');
        socket.off('order:accept_confirmed');
        socket.off('order:already_taken');
    };

    const setupSocketListeners = () => {
        if (!socket) return;

        // New order broadcast
        socket.on('order:new_request', (data) => {
            setAvailableOrders(prev => {
                // Avoid duplicates
                if (prev.find(o => o._id === data._id)) return prev;
                return [data, ...prev];
            });
            toast.success('New order available!');
            // Play sound
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { });
        });

        // Order taken by someone else
        socket.on('order:request_expired', ({ orderId }) => {
            setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
        });

        // Successful acceptance
        socket.on('order:accept_confirmed', ({ order }) => {
            console.log('✅ Order accept confirmed:', order._id);
            setAcceptingId(null);
            toast.success('Order assigned successfully!');
            navigate('/delivery/active-order');
        });

        // Already taken
        socket.on('order:already_taken', ({ message }) => {
            toast.error(message);
            setAcceptingId(null);
            fetchAvailableOrders(); // Refresh list
        });
    };

    const fetchAvailableOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/delivery/available-orders');
            setAvailableOrders(data.orders || []);
        } catch (error) {
            console.error('Failed to fetch available orders');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = (orderId) => {
        const userId = user?._id || user?.id;
        if (!userId) {
            console.error('❌ Missing User ID in handleAcceptOrder', { user });
            toast.error('Authentication error. Please re-login.');
            return;
        }
        if (!user?.isOnline) {
            toast.error('You must be online to accept orders');
            return;
        }
        console.log(`📡 Emitting order:accept for ${orderId} by ${userId}`);
        setAcceptingId(orderId);
        if (socket) {
            socket.emit('order:accept', { orderId, partnerId: userId });
        } else {
            setAcceptingId(null);
            toast.error('Socket connection error');
        }
    };

    const handleIgnoreOrder = async (orderId) => {
        try {
            if (socket) {
                socket.emit('order:decline', { orderId, partnerId: user._id });
            }
            setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
            toast.success('Order ignored');
        } catch (error) {
            toast.error('Failed to ignore order');
        }
    };

    return (
        <div className="pb-24 pt-4 px-4 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white">Available Orders</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                        {user?.isOnline ? '🔴 Waiting for new requests...' : '⚪ Push Go Online to see orders'}
                    </p>
                </div>
                <button
                    onClick={fetchAvailableOrders}
                    disabled={loading}
                    className="p-3 bg-[#1B263B] rounded-2xl text-brand-primary border border-gray-700 hover:bg-[#25334d] transition-colors"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest text-center">Scanning for orders...</p>
                </div>
            ) : availableOrders.length === 0 ? (
                <div className="bg-[#1B263B] rounded-[32px] p-10 text-center border border-gray-700">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">No Orders Nearby</h3>
                    <p className="text-sm text-gray-400 max-w-[200px] mx-auto leading-relaxed italic">
                        "Stay online. Good things come to those who wait."
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {availableOrders.map((order, index) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-[#1B263B] rounded-[32px] overflow-hidden border border-gray-700 shadow-xl group"
                            >
                                {/* Order ID & Time */}
                                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-white/5">
                                    <div className="flex items-center space-x-2">
                                        <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                                            <Package size={16} />
                                        </div>
                                        <span className="font-black text-xs text-gray-300">#{order.orderId?.slice(-6).toUpperCase()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-brand-secondary font-black text-[10px] uppercase">
                                        <Clock size={12} />
                                        <span>Just Now</span>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pickup Location</p>
                                            <div className="flex items-start space-x-2">
                                                <MapPin className="text-brand-primary mt-1 shrink-0" size={16} />
                                                <p className="text-sm font-bold text-white line-clamp-2">SwiftMart Warehouse - Sector 62</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Earning</p>
                                            <p className="text-xl font-black text-brand-primary leading-none">₹{order.commission || Math.round(order.totalAmount * 0.15)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                                                    <ShoppingBag size={20} className="text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-200">{order.items?.length || 0} Items</p>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Weight Approx: 2kg</p>
                                                </div>
                                            </div>
                                            <div className="h-10 w-[1px] bg-gray-700" />
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-300">{order.deliveryLocality || 'Downtown Area'}</p>
                                                <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-tighter">Deliver by 15 mins</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex space-x-3 mt-4">
                                        <button
                                            onClick={() => handleIgnoreOrder(order._id)}
                                            className="flex-1 py-4 bg-gray-800 text-gray-400 font-black rounded-2xl uppercase text-[10px] tracking-widest border border-gray-700 hover:bg-gray-700 transition-colors"
                                        >
                                            Ignore
                                        </button>
                                        <button
                                            onClick={() => handleAcceptOrder(order._id)}
                                            disabled={acceptingId === order._id}
                                            className="flex-[2] py-4 bg-brand-primary text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-brand-primary/20 flex items-center justify-center space-x-2 transition-all active:scale-95"
                                        >
                                            {acceptingId === order._id ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : (
                                                <>
                                                    <span>Accept Order</span>
                                                    <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Online Status Float */}
            {!user?.isOnline && (
                <div className="fixed bottom-24 left-4 right-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center backdrop-blur-md">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest">
                        You are currently offline. Please go online to receive orders.
                    </p>
                </div>
            )}
        </div>
    );
};

export default NewOrdersPage;
