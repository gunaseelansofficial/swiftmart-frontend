import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, MapPin, Calendar, Clock, ArrowUpRight, RotateCcw, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/shared/Navbar';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { getImageUrl } from '../../utils/imageHelper';
import PullToRefresh from '../../components/shared/PullToRefresh';

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hover, setHover] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const dispatch = useDispatch();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders/my');
            setOrders(data.orders);
        } catch (error) {
            toast.error('Failed to fetch your orders');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchOrders();
    };

    const toggleOrderDetails = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const handleReorder = (order) => {
        order.items.forEach(item => {
            dispatch(addToCart({
                ...item.product,
                price: item.price,
                quantity: item.quantity
            }));
        });
        toast.success('Items added to cart!');
    };

    const handleCancelOrder = async (e, orderId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        
        try {
            const { data } = await api.patch(`/orders/${orderId}/cancel`);
            toast.success(data.message || 'Order cancelled successfully');
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    const handleRateProduct = (e, pid) => {
        e.stopPropagation();
        setSelectedProduct(pid);
        setRating(0);
        setComment('');
    };

    const submitRating = async () => {
        try {
            if (!comment.trim()) {
                toast.error('Please add a comment with your rating');
                return;
            }
            await api.post(`/products/${selectedProduct}/review`, { rating, comment });
            toast.success('Thank you for your review!');
            setSelectedProduct(null);
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'placed': 'bg-blue-100 text-blue-700',
            'confirmed': 'bg-indigo-100 text-indigo-700',
            'packed': 'bg-yellow-100 text-yellow-700',
            'picked_up': 'bg-orange-100 text-orange-700',
            'on_the_way': 'bg-amber-100 text-amber-700',
            'delivered': 'bg-green-100 text-green-700',
            'cancelled': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors pb-24 md:pb-12">
            <Navbar />
            <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
                <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                    <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-[#1A1A2E] dark:text-white mb-8 md:mb-12 uppercase italic tracking-tighter decoration-brand-primary underline underline-offset-8">My Orders</h1>

                {loading ? (
                    <div className="space-y-6">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-40 bg-white dark:bg-white/5 rounded-3xl animate-pulse border border-gray-100 dark:border-white/5 shadow-sm" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-[40px] border border-gray-100 dark:border-white/5 shadow-xl">
                        <Package size={80} className="mx-auto text-gray-100 dark:text-gray-800 mb-8" />
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-3 uppercase tracking-tighter italic">No orders yet</h3>
                        <p className="text-gray-400 font-medium mb-12">You haven't placed any orders with us yet.</p>
                        <Link to="/" className="btn-primary !py-4 px-12 rounded-2xl shadow-xl shadow-brand-primary/20">Browse Products</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <motion.div
                                key={order._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/10 shadow-xl shadow-blue-900/5 overflow-hidden transition-all duration-300 ${expandedOrderId === order._id ? 'ring-2 ring-brand-primary/20' : ''}`}
                            >
                                {/* Header Section */}
                                <div 
                                    onClick={() => toggleOrderDetails(order._id)}
                                    className="p-6 md:p-8 cursor-pointer group"
                                >
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                                        <div className="flex items-center space-x-6">
                                            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0 transition-transform group-hover:scale-110">
                                                <Package size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <p className="text-lg font-black text-[#1A1A2E] dark:text-white tracking-tight">#{order.orderId || order._id.slice(-6).toUpperCase()}</p>
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                                        {order.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-3 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-lg w-fit">
                                                    <span className="flex items-center"><Calendar size={12} className="mr-1.5" /> {format(new Date(order.createdAt), 'dd MMM, yyyy')}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center"><Clock size={12} className="mr-1.5" /> {format(new Date(order.createdAt), 'hh:mm a')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between md:justify-end gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Grand Total</p>
                                                <p className="text-2xl font-heading font-extrabold text-brand-primary tracking-tighter italic">₹{order.finalAmount || order.totalAmount}</p>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedOrderId === order._id ? 180 : 0 }}
                                                className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand-primary transition-colors"
                                            >
                                                <ChevronRight size={20} />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Section */}
                                <AnimatePresence>
                                    {expandedOrderId === order._id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                            className="border-t border-gray-100 dark:border-white/5"
                                        >
                                            <div className="p-6 md:p-10 space-y-10">
                                                {/* Items Area */}
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic mb-6">Ordered Items</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="bg-gray-50 dark:bg-white/5 p-4 rounded-3xl flex items-center space-x-4 border border-gray-100 dark:border-white/5 group/item transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-lg hover:shadow-blue-900/5">
                                                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-navy-dark overflow-hidden p-2 shrink-0 border border-gray-100 dark:border-white/10 group-hover/item:rotate-3 transition-transform">
                                                                    <img 
                                                                        src={getImageUrl(item.product?.images?.[0] || item.product?.image)} 
                                                                        alt="" 
                                                                        className="w-full h-full object-contain" 
                                                                        onError={(e) => e.target.src = '/placeholder-product.png'}
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-black text-gray-800 dark:text-gray-200 line-clamp-1 truncate">{item.product?.name || 'Product'}</p>
                                                                    <div className="flex justify-between items-center mt-1">
                                                                        <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Qty: {item.quantity}</p>
                                                                        <p className="text-sm font-black text-gray-800 dark:text-white italic">₹{item.price * item.quantity}</p>
                                                                    </div>
                                                                </div>
                                                                {order.status === 'delivered' && (
                                                                    <button
                                                                        onClick={(e) => handleRateProduct(e, item.product._id)}
                                                                        className="p-3 bg-white dark:bg-white/10 rounded-2xl text-brand-primary border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all shadow-lg shadow-brand-primary/10"
                                                                        title="Rate Product"
                                                                    >
                                                                        <Star size={18} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Summary Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-white/5">
                                                    {/* Delivery Info */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic">Delivery Info</h4>
                                                        <div className="flex items-start space-x-3 text-gray-600 dark:text-gray-400">
                                                            <MapPin size={18} className="shrink-0 text-brand-primary mt-1" />
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{order.shippingAddress?.street || 'N/A'}</p>
                                                                <p className="text-[10px] font-medium leading-relaxed">{order.shippingAddress?.city}, {order.shippingAddress?.pincode}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Payment Breakdown */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic">Payment Details</h4>
                                                        <div className="space-y-2 bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                                                            <div className="flex justify-between text-[11px] font-bold text-gray-500">
                                                                <span className="uppercase tracking-widest">Items Total</span>
                                                                <span>₹{order.totalAmount}</span>
                                                            </div>
                                                            <div className="flex justify-between text-[11px] font-bold text-green-500">
                                                                <span className="uppercase tracking-widest">Shipping Fee</span>
                                                                <span>{order.finalAmount - order.totalAmount > 0 ? `₹${order.finalAmount - order.totalAmount}` : 'FREE'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-200 dark:border-white/10">
                                                                <span className="text-[10px] font-black text-[#1A1A2E] dark:text-white uppercase tracking-[0.2em]">Grand Total</span>
                                                                <span className="text-xl font-heading font-extrabold text-brand-primary tracking-tighter italic">₹{order.finalAmount || order.totalAmount}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                    {['confirmed', 'packed', 'picked_up', 'on_the_way'].includes(order.status) && (
                                                        <Link
                                                            to={`/track/${order._id}`}
                                                            className="flex-1 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-primary/20 flex items-center justify-center space-x-3 !py-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                        >
                                                            <span>Track Live Status</span>
                                                            <ArrowUpRight size={16} />
                                                        </Link>
                                                    )}
                                                    {order.status === 'delivered' && (
                                                        <button
                                                            onClick={() => handleReorder(order)}
                                                            className="flex-1 bg-navy-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-navy-dark/20 flex items-center justify-center space-x-3 !py-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                        >
                                                            <RotateCcw size={16} />
                                                            <span>Order Again</span>
                                                        </button>
                                                    )}
                                                    {['placed', 'payment_verified', 'confirmed'].includes(order.status) && (
                                                        <button
                                                            onClick={(e) => handleCancelOrder(e, order._id)}
                                                            className="flex-1 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest !py-5 transition-all hover:bg-red-100"
                                                        >
                                                            <span>Cancel Order</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
                </main>
            </PullToRefresh>

            {/* Rating Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-navy-dark/80 backdrop-blur-md"
                            onClick={() => setSelectedProduct(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            className="bg-white dark:bg-navy-dark w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 p-10 text-center border border-white/10 overflow-hidden"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-brand-primary/10 rounded-full -mt-20 blur-3xl" />
                            
                            <h3 className="text-2xl font-heading font-extrabold text-[#1A1A2E] dark:text-white mb-3 uppercase italic tracking-tighter relative z-10">Rate Experience</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 font-medium relative z-10">How would you describe the quality?</p>

                            <div className="flex justify-center space-x-3 mb-10 relative z-10">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                        className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                    >
                                        <Star
                                            size={36}
                                            className={`${star <= (hover || rating)
                                                ? 'fill-brand-accent text-brand-accent'
                                                : 'text-gray-100 dark:text-white/10'
                                                } transition-colors drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)]`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="mb-10 relative z-10">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell us what you loved about this product..."
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-brand-primary/20 rounded-3xl p-6 text-sm font-medium focus:outline-none transition-all placeholder:text-gray-400 min-h-[120px] shadow-inner"
                                />
                            </div>

                            <div className="flex space-x-4 relative z-10">
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="flex-1 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl font-black text-gray-400 text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                >
                                    Later
                                </button>
                                <button
                                    onClick={submitRating}
                                    disabled={rating === 0}
                                    className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-primary/20 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105"
                                >
                                    Post Review
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderHistoryPage;
