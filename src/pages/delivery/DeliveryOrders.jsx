import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    ChevronLeft,
    Calendar,
    CheckCircle2,
    Clock,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DeliveryOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/delivery/orders');
            setOrders(data.orders);
        } catch (error) {
            toast.error('Failed to load order history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-screen bg-[#0D1B2A] flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-4">
                <button
                    onClick={() => navigate('/delivery/dashboard')}
                    className="p-3 bg-[#1B263B] rounded-xl text-gray-400 border border-gray-700"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-black text-white uppercase tracking-widest leading-none">Order History</h1>
            </div>

            <div className="space-y-4">
                {orders.length > 0 ? (
                    orders.map((order) => (
                        <div key={order._id} className="bg-[#1B263B] p-6 rounded-[32px] border border-gray-700 shadow-xl overflow-hidden relative">
                            {/* Accent badge */}
                            <div className="absolute top-0 right-0 p-2 bg-green-500/20 text-green-500 rounded-bl-2xl flex items-center space-x-1">
                                <CheckCircle2 size={12} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Delivered</span>
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Order ID</p>
                                    <p className="text-lg font-black text-white leading-none">#{order.orderId.slice(-8)}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Earnings</p>
                                    <p className="text-lg font-black text-brand-primary leading-none">₹{Math.round(order.totalAmount * 0.15)}</p>
                                </div>
                            </div>

                            <div className="bg-[#0D1B2A] rounded-2xl p-4 border border-gray-700 space-y-3 mb-4">
                                <div className="flex items-center space-x-3 text-xs text-gray-400 font-bold">
                                    <Calendar size={14} className="text-brand-primary" />
                                    <span>{new Date(order.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <div className="w-1 h-1 rounded-full bg-gray-700" />
                                    <Clock size={14} className="text-brand-primary" />
                                    <span>{new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-start space-x-3 text-xs text-gray-300 font-bold">
                                    <MapPin size={14} className="text-coral-accent shrink-0 mt-0.5" />
                                    <span className="line-clamp-1">{order.deliveryAddress.street}, {order.deliveryAddress.city}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-[#1B263B] flex items-center justify-center text-[10px] font-black text-gray-500">
                                            {i}
                                        </div>
                                    ))}
                                    {order.items.length > 3 && (
                                        <div className="w-8 h-8 rounded-full bg-[#0D1B2A] border-2 border-[#1B263B] flex items-center justify-center text-[8px] font-black text-brand-primary">
                                            +{order.items.length - 3}
                                        </div>
                                    )}
                                </div>
                                <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center space-x-1 hover:text-white transition-colors">
                                    <span>Details</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto text-gray-600 border border-gray-700">
                            <ShoppingBag size={32} />
                        </div>
                        <p className="text-gray-500 font-black uppercase text-xs tracking-widest">No delivered orders yet</p>
                        <button
                            onClick={() => navigate('/delivery/dashboard')}
                            className="text-brand-primary font-black uppercase text-[10px] tracking-widest"
                        >
                            Go Online to get orders
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryOrders;
