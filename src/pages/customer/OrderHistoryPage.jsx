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
import BottomSheet from '../../components/shared/BottomSheet';
import PullToRefresh from '../../components/shared/PullToRefresh';

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingOrder, setRatingOrder] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
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

    const handleViewDetails = (order) => {
        setSelectedOrderDetails(order);
        setIsDetailsSheetOpen(true);
    };

    const handleReorder = (order) => {
        order.items.forEach(item => {
            dispatch(addToCart({
                _id: item.product._id,
                name: item.product.name,
                price: item.price,
                image: item.product.image,
                quantity: item.quantity
            }));
        });
        toast.success('Items added to cart!');
    };

    const handleRateProduct = (pid) => {
        setSelectedProduct(pid);
        setRating(0);
    };

    const submitRating = async () => {
        try {
            await api.post(`/products/${selectedProduct}/review`, { rating });
            toast.success('Thank you for your rating!');
            setSelectedProduct(null);
            fetchOrders();
        } catch (error) {
            toast.error('Failed to submit rating');
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
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors pb-24 md:pb-0">
            <Navbar />
            <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
                <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                    <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-gray-800 dark:text-white mb-6 md:mb-8 uppercase tracking-widest decoration-brand-primary underline underline-offset-8">My Orders</h1>

                {loading ? (
                    <div className="space-y-6">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-40 bg-white dark:bg-white/5 rounded-md animate-pulse border border-gray-100 dark:border-white/5" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-md border border-gray-100 dark:border-white/5 shadow-sm">
                        <Package size={64} className="mx-auto text-gray-200 dark:text-gray-700 mb-6" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No orders yet</h3>
                        <p className="text-text-muted mb-8">You haven't placed any orders with us yet.</p>
                        <Link to="/" className="btn-primary">Browse Products</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-white/5 rounded-2xl md:rounded-md shadow-sm md:shadow-card border border-gray-100 dark:border-white/5 overflow-hidden hover:shadow-hover transition-all"
                            >
                                <div className="p-4 md:p-6">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 md:mb-6">
                                        <div className="flex items-center space-x-3 md:space-x-4">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary shrink-0">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-white">Order #{order.orderId || order._id.slice(-6).toUpperCase()}</p>
                                                <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400">
                                                    <span className="flex items-center"><Calendar size={12} className="mr-1" /> {format(new Date(order.createdAt), 'dd MMM, yyyy')}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center"><Clock size={12} className="mr-1" /> {format(new Date(order.createdAt), 'hh:mm a')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                            {order.status === 'on_the_way' && (
                                                <Link
                                                    to={`/track/${order._id}`}
                                                    className="flex items-center space-x-2 text-brand-primary font-bold text-[10px] uppercase tracking-widest bg-brand-primary/5 px-4 py-1.5 rounded-full hover:bg-brand-primary/10 transition-colors"
                                                >
                                                    <span>Track Live</span>
                                                    <ArrowUpRight size={14} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop Items Preview (Hidden on mobile) */}
                                    <div className="hidden md:flex flex-wrap gap-4 mb-6">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3 rounded-md flex items-center space-x-4 flex-1 min-w-[200px]">
                                                <img 
                                                    src={getImageUrl(item.product?.image)} 
                                                    alt="" 
                                                    className="w-10 h-10 rounded object-cover" 
                                                    onError={(e) => e.target.src = '/placeholder-product.png'}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-gray-800 dark:text-white">{item.product?.name || 'Product'}</p>
                                                    <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                                                </div>
                                                {order.status === 'delivered' && (
                                                    <button
                                                        onClick={() => handleRateProduct(item.product._id)}
                                                        className="text-[9px] font-bold uppercase text-brand-primary border border-brand-primary/20 px-2 py-1 rounded hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                                                    >
                                                        Rate
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 md:pt-6 border-t border-gray-50 dark:border-white/5">
                                        <div className="flex items-center space-x-4 md:space-x-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                                <p className="text-lg font-heading font-extrabold text-gray-800 dark:text-white">₹{order.finalAmount || order.totalAmount}</p>
                                            </div>
                                            {order.status === 'delivered' && (
                                                <button
                                                    onClick={() => handleReorder(order)}
                                                    className="flex items-center space-x-2 bg-navy-dark text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary transition-all shadow-md"
                                                >
                                                    <RotateCcw size={14} />
                                                    <span>Reorder</span>
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleViewDetails(order)}
                                            className="flex items-center space-x-1 md:space-x-2 text-[10px] md:text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-brand-primary transition-colors tap-target"
                                        >
                                            <span>View Details</span>
                                            <ChevronRight size={14} className="md:w-4 md:h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                </main>
            </PullToRefresh>

            {/* Order Details Bottom Sheet */}
            <BottomSheet
                isOpen={isDetailsSheetOpen}
                onClose={() => setIsDetailsSheetOpen(false)}
                title="Order Details"
                snapPoints={[0.7]}
            >
                {selectedOrderDetails && (
                    <div className="space-y-6 pb-6">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                            <span className="text-sm font-bold text-gray-800 dark:text-white">Order #{selectedOrderDetails.orderId || selectedOrderDetails._id.slice(-6).toUpperCase()}</span>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(selectedOrderDetails.status)}`}>
                                {selectedOrderDetails.status.replace('_', ' ')}
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-[11px] font-bold text-gray-400 border-b border-gray-100 dark:border-white/5 pb-4">
                            <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> {format(new Date(selectedOrderDetails.createdAt), 'dd MMM, yyyy')}</span>
                            <span className="flex items-center"><Clock size={14} className="mr-1.5" /> {format(new Date(selectedOrderDetails.createdAt), 'hh:mm a')}</span>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Items</h4>
                            {selectedOrderDetails.items.map((item, idx) => (
                                 <div key={idx} className="flex items-center space-x-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="w-14 h-14 rounded-xl bg-white dark:bg-navy-dark overflow-hidden p-2 shrink-0 border border-gray-100 dark:border-white/10">
                                        <img 
                                            src={getImageUrl(item.product?.image)} 
                                            alt="" 
                                            className="w-full h-full object-contain" 
                                            onError={(e) => e.target.src = '/placeholder-product.png'}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.product?.name || 'Product'}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Qty: {item.quantity}</p>
                                            <p className="text-sm font-black text-gray-800 dark:text-white">₹{item.price * item.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-white/10 space-y-3 text-sm">
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                <span className="font-bold">Item Total</span>
                                <span className="font-black">₹{selectedOrderDetails.totalAmount}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100 dark:border-white/10">
                                <span className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-widest">Grand Total</span>
                                <span className="text-2xl font-black text-brand-primary">₹{selectedOrderDetails.finalAmount || selectedOrderDetails.totalAmount}</span>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            {['confirmed', 'packed', 'picked_up', 'on_the_way'].includes(selectedOrderDetails.status) && (
                                <Link
                                    to={`/track/${selectedOrderDetails._id}`}
                                    className="flex-1 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-brand-primary/20 flex items-center justify-center space-x-2 !py-4 transition-all hover:scale-[1.02]"
                                >
                                    <span>Track Live Location</span>
                                    <ArrowUpRight size={16} />
                                </Link>
                            )}
                            {selectedOrderDetails.status === 'delivered' && (
                                <button
                                    onClick={() => handleReorder(selectedOrderDetails)}
                                    className="flex-1 bg-navy-dark dark:bg-white text-white dark:text-navy-dark rounded-xl font-bold text-xs uppercase shadow-lg shadow-navy-dark/20 flex items-center justify-center space-x-2 !py-4 transition-all"
                                >
                                    <RotateCcw size={16} />
                                    <span>Order Again</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </BottomSheet>

            {/* Rating Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-navy-dark/60 backdrop-blur-sm"
                            onClick={() => setSelectedProduct(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-navy-dark w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-8 text-center"
                        >
                            <h3 className="text-xl font-heading font-extrabold text-gray-800 dark:text-white mb-2 uppercase italic tracking-tighter">Rate Your Product</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">How was the quality of this item?</p>

                            <div className="flex justify-center space-x-2 mb-8">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                        className="focus:outline-none transition-transform hover:scale-125"
                                    >
                                        <Star
                                            size={32}
                                            className={`${star <= (hover || rating)
                                                ? 'fill-brand-accent text-brand-accent'
                                                : 'text-gray-200 dark:text-white/10'
                                                } transition-colors`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="flex-1 py-3 border border-gray-100 dark:border-white/10 rounded-xl font-bold text-gray-500 dark:text-gray-400 text-xs uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitRating}
                                    disabled={rating === 0}
                                    className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:shadow-none transition-all"
                                >
                                    Submit
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
