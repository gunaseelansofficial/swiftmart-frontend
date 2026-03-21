import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    Search,
    Filter,
    MoreVertical,
    Eye,
    UserPlus,
    CheckCircle,
    XCircle,
    Download,
    Calendar,
    ChevronLeft,
    ChevronRight,
    User,
    Clock,
    CreditCard
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { getImageUrl } from '../../utils/imageHelper';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalOrders, setTotalOrders] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        status: 'All',
        paymentStatus: 'All',
        search: '',
        from: '',
        to: ''
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [partners, setPartners] = useState([]);
    const [packingOrderId, setPackingOrderId] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchOrders();
        fetchPartners();
    }, [currentPage, filters.status, filters.paymentStatus]);

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

        socket.on('connect', () => {
            socket.emit('admin:join');
        });

        // Any order status change → update that specific order in local state
        socket.on('order:status_changed', ({ orderId, status, partnerId, pickupOTP, pickupOTPExpiry }) => {
            setOrders(prev => prev.map(order =>
                order._id === orderId
                    ? { 
                        ...order, 
                        status, 
                        deliveryPartner: partnerId || order.deliveryPartner,
                        pickupOTP: pickupOTP || order.pickupOTP,
                        pickupOTPExpiry: pickupOTPExpiry || order.pickupOTPExpiry
                      }
                    : order
            ));

            // Also update the drawer if this order is currently selected
            setSelectedOrder(prev => {
                if (prev?._id === orderId) {
                    return { 
                        ...prev, 
                        status, 
                        deliveryPartner: partnerId || prev.deliveryPartner,
                        pickupOTP: pickupOTP || prev.pickupOTP,
                        pickupOTPExpiry: pickupOTPExpiry || prev.pickupOTPExpiry
                    };
                }
                return prev;
            });
        });

        // New order placed by customer → prepend to list
        socket.on('order:new', (newOrder) => {
            setOrders(prev => [newOrder, ...prev]);
            toast.success(`New order #${newOrder.orderId} received!`);
        });

        return () => socket.disconnect();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/orders', {
                params: { ...filters, page: currentPage }
            });
            setOrders(data.orders);
            setTotalOrders(data.total);
        } catch (error) {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchPartners = async () => {
        try {
            const { data } = await api.get('/admin/delivery-partners');
            setPartners(data.partners.filter(p => p.isOnline));
        } catch (error) {
            console.error('Failed to fetch partners');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.patch(`/admin/orders/${id}/status`, { status });
            toast.success('Order status updated');
            fetchOrders();
            if (selectedOrder?._id === id) setSelectedOrder(prev => ({ ...prev, status }));
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handlePackOrder = async (orderId) => {
        setPackingOrderId(orderId);
        try {
            const res = await api.patch(`/admin/orders/${orderId}/pack`);
            if (res.data.success) {
                // Update this order's status locally — no page refresh
                setOrders(prev => prev.map(o =>
                    o._id === orderId ? { ...o, status: 'broadcasting' } : o
                ));
                toast.success('📦 Order packed! Broadcasting to delivery partners...');
            }
        } catch (err) {
            toast.error('Failed to pack order: ' + err.response?.data?.message);
        } finally {
            setPackingOrderId(null);
        }
    };

    const handleAssignPartner = async (orderId, partnerId) => {
        try {
            await api.patch(`/admin/orders/${orderId}/assign`, { partnerId });
            toast.success('Partner assigned successfully');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to assign partner');
        }
    };

    const statusConfig = {
        placed: { label: 'Placed', color: 'bg-blue-100 text-blue-700' },
        payment_verified: { label: 'Paid & Ready', color: 'bg-indigo-100 text-indigo-700' },
        packed: { label: 'Packed', color: 'bg-yellow-100 text-yellow-700' },
        broadcasting: { label: 'Finding Partner', color: 'bg-purple-100 text-purple-700' },
        assigned: { label: 'Partner Assigned', color: 'bg-indigo-100 text-indigo-700' },
        picked_up: { label: 'Picked Up', color: 'bg-orange-100 text-orange-700' },
        on_the_way: { label: 'On The Way', color: 'bg-amber-100 text-amber-700' },
        delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
        cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
        assignment_failed: { label: 'Assign Failed', color: 'bg-red-100 text-red-700' }
    };

    const renderActionButton = (order) => {
        switch (order.status) {
            case 'placed':
            case 'payment_verified':
                return (
                    <button
                        onClick={() => handlePackOrder(order._id)}
                        className="bg-amber-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md shadow-amber-200 flex items-center space-x-2"
                    >
                        <span>📦 Pack Order</span>
                    </button>
                );
            case 'packed':
                return <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">⏳ Finding Partner...</span>;
            case 'assigned':
                return <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🚴 Partner Assigned</span>;
            case 'picked_up':
                return <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🛍️ Picked Up</span>;
            case 'on_the_way':
                return (
                    <button onClick={() => toast.success('Tracking live...')} className="text-[10px] font-black text-amber-600 uppercase tracking-widest underline">
                        📍 Track Live
                    </button>
                );
            case 'delivered':
                return <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">✅ Completed</span>;
            default:
                return null;
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-heading font-extrabold text-gray-800 uppercase tracking-widest">Order Management</h1>
                <button className="btn-primary !py-2 flex items-center space-x-2">
                    <Download size={18} />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-6 rounded-md shadow-card border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Order ID / Customer..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-md focus:ring-2 focus:ring-brand-primary"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                        />
                    </div>
                    <select
                        className="bg-gray-50 border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary font-bold text-xs uppercase"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        {['All', 'placed', 'payment_verified', 'packed', 'assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled'].map(s => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                        ))}
                    </select>
                    <select
                        className="bg-gray-50 border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-brand-primary font-bold text-xs uppercase"
                        value={filters.paymentStatus}
                        onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                    >
                        {['All', 'pending', 'completed', 'paid', 'failed', 'pending_cod'].map(s => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                        ))}
                    </select>
                    <div className="md:col-span-2 flex items-center space-x-2">
                        <input type="date" className="bg-gray-50 border-none rounded-md px-3 py-2 text-xs font-bold" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
                        <span className="text-gray-400">to</span>
                        <input type="date" className="bg-gray-50 border-none rounded-md px-3 py-2 text-xs font-bold" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-md shadow-card border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Partner</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Quick Action</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan="8" className="p-6 h-12 bg-gray-50/50"></td>
                                </tr>
                            ))
                        ) : orders.map(order => (
                            <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 font-bold text-gray-700 text-xs">#{order.orderId}</td>
                                <td className="p-4">
                                    <p className="text-sm font-bold text-gray-800">{order.customer?.name}</p>
                                    <p className="text-[10px] text-gray-400">{order.customer?.phone}</p>
                                </td>
                                <td className="p-4 text-xs font-bold text-gray-600">{order.items.length} items</td>
                                <td className="p-4 font-heading font-extrabold text-brand-primary">₹{order.totalAmount}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-tight ${['paid', 'completed'].includes(order.payment.status) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {order.payment.method} / {order.payment.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {order.status ? (
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                            {statusConfig[order.status]?.label || order.status}
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700">
                                            Placed
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    {order.deliveryPartner ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{order.deliveryPartner.name}</span>
                                            <span className="text-[9px] text-gray-400 font-bold">{order.deliveryPartner.phone}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">—</span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    {(order.status === 'placed' || order.status === 'payment_verified' || !order.status) && (
                                        <button
                                            onClick={() => handlePackOrder(order._id)}
                                            disabled={packingOrderId === order._id}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {packingOrderId === order._id ? '⏳ Packing...' : '📦 Pack Order'}
                                        </button>
                                    )}
                                    {order.status === 'broadcasting' && (
                                        <span className="text-purple-600 text-[10px] font-black uppercase tracking-widest">⏳ Finding partner...</span>
                                    )}
                                    {order.status === 'assigned' && (
                                        <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">🚴 Partner assigned</span>
                                    )}
                                    {order.status === 'picked_up' && (
                                        <span className="text-orange-600 text-[10px] font-black uppercase tracking-widest">🛍️ Picked up</span>
                                    )}
                                    {order.status === 'delivered' && (
                                        <span className="text-green-600 text-[10px] font-black uppercase tracking-widest">✅ Delivered</span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center space-x-2">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <div className="relative group">
                                            <button className="p-2 text-gray-400 hover:text-gray-600">
                                                <MoreVertical size={18} />
                                            </button>
                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white shadow-xl rounded-md border border-gray-100 hidden group-hover:block z-20">
                                                <button onClick={() => handleStatusUpdate(order._id, 'cancelled')} className="w-full p-3 text-left text-xs font-bold hover:bg-gray-50 flex items-center space-x-2">
                                                    <XCircle size={14} className="text-red-500" />
                                                    <span>Cancel Order</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-6 bg-gray-50 flex justify-between items-center">
                    <p className="text-xs text-gray-500 font-bold uppercase">Total {totalOrders} Orders</p>
                    <div className="flex space-x-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded bg-white border border-gray-200 disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 rounded bg-white border border-gray-200"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Order Detail Drawer */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="fixed top-0 right-0 h-screen w-full max-w-lg bg-white shadow-2xl z-[101] overflow-y-auto"
                        >
                            <div className="p-8">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="mb-8 p-2 hover:bg-gray-100 rounded-full text-gray-400"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="text-2xl font-heading font-extrabold text-gray-800">Order #{selectedOrder.orderId}</h2>
                                        <p className="text-xs text-gray-400 mt-1">{format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusConfig[selectedOrder.status]?.color}`}>
                                        {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                                    </span>
                                </div>

                                <div className="space-y-10">
                                    {/* Customer Section */}
                                    <div>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Customer Info</h4>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{selectedOrder.customer?.name}</p>
                                                <p className="text-xs text-text-muted">{selectedOrder.customer?.email}</p>
                                                <p className="text-xs text-text-muted">{selectedOrder.customer?.phone}</p>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-xs font-bold text-gray-600 bg-gray-50 p-4 rounded">
                                            {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.pincode}
                                        </p>
                                    </div>

                                    {/* Items Section */}
                                    <div>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Order Items</h4>
                                        <div className="space-y-4">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                                                            <img 
                                                                src={getImageUrl(item.product?.image)} 
                                                                className="w-full h-full object-cover" 
                                                                onError={(e) => e.target.src = '/placeholder-product.png'}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800">{item.product?.name || 'Item'}</p>
                                                            <p className="text-[10px] text-gray-400">Qty: {item.quantity} x ₹{item.price}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-gray-700">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-dashed border-gray-100 flex justify-between items-center">
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Grand Total</span>
                                            <span className="text-xl font-heading font-extrabold text-brand-primary">₹{selectedOrder.totalAmount}</span>
                                        </div>
                                    </div>

                                    {/* Payment Section */}
                                    <div className="bg-gray-50 p-6 rounded-md">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Details</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Method</p>
                                                <div className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                                                    <CreditCard size={14} />
                                                    <span className="uppercase">{selectedOrder.payment.method}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Status</p>
                                                <span className={`text-[10px] font-bold ${selectedOrder.payment.status === 'paid' ? 'text-green-600' : 'text-amber-500'}`}>
                                                    {selectedOrder.payment.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Partner Info */}
                                    {selectedOrder.deliveryPartner && (
                                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-md">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Delivery Partner</h4>
                                                <div className="flex items-center space-x-1 text-indigo-600 font-bold text-[9px] uppercase">
                                                    <Clock size={12} />
                                                    <span>Assigned</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{selectedOrder.deliveryPartner.name}</p>
                                                    <p className="text-xs text-text-muted">{selectedOrder.deliveryPartner.phone}</p>
                                                    <button onClick={() => toast.success('Calling feature coming soon...')} className="mt-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-600">
                                                        📞 Contact Partner
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pickup OTP — visible when status is assigned */}
                                    {selectedOrder.status === 'assigned' && selectedOrder.pickupOTP && (
                                        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6 text-center">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">🔐 Pickup OTP — Show to Partner</p>
                                            <div className="flex justify-center gap-3 mb-3">
                                                {selectedOrder.pickupOTP.split('').map((digit, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-14 h-16 flex items-center justify-center rounded-xl bg-amber-400 text-white text-3xl font-black shadow-md shadow-amber-200"
                                                    >
                                                        {digit}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Share this verbally with the delivery partner at pickup</p>
                                        </div>
                                    )}

                                    {/* Timeline */}
                                    <div>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Status Timeline</h4>
                                        <div className="space-y-6">
                                            {selectedOrder.statusTimeline?.map((t, idx) => (
                                                <div key={idx} className="flex items-start space-x-3">
                                                    <div className="w-2 h-2 rounded-full bg-brand-primary mt-1" />
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">{t.status.replace('_', ' ')}</p>
                                                        <p className="text-[10px] text-gray-400">{format(new Date(t.timestamp), 'dd MMM, hh:mm a')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default OrderManagement;
