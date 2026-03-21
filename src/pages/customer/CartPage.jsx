import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    Trash2,
    Minus,
    Plus,
    ShoppingBag,
    ArrowRight,
    ChevronLeft,
    Ticket,
    Info
} from 'lucide-react';
import { addToCart, removeFromCart, deleteFromCart } from '../../store/slices/cartSlice';
import Navbar from '../../components/shared/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { getImageUrl } from '../../utils/imageHelper';

const CartPage = () => {
    const { items, totalAmount } = useSelector((state) => state.cart);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isValidating, setIsValidating] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const deliveryFee = totalAmount > 299 ? 0 : 40;
    const gst = Math.round(totalAmount * 0.05);
    const finalTotal = totalAmount - discount + deliveryFee + gst;

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidating(true);
        try {
            // Mock validation for now or use API if built
            const { data } = await api.post('/coupons/validate', { code: couponCode, orderAmount: totalAmount });
            setDiscount(data.discount);
            setAppliedCoupon(couponCode);
            toast.success(`Coupon applied! You saved ₹${data.discount}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid coupon code');
            setDiscount(0);
            setAppliedCoupon(null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            toast.error('Please login to continue');
            navigate('/login?redirect=checkout');
            return;
        }
        navigate('/checkout');
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-main-bg">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                    <div className="w-64 h-64 bg-brand-bg-light rounded-full flex items-center justify-center mx-auto mb-8">
                        <ShoppingBag size={80} className="text-brand-primary opacity-20" />
                    </div>
                    <h2 className="text-3xl font-bold text-text-primary mb-4 tracking-tight">Your cart is empty</h2>
                    <p className="text-text-secondary mb-8 max-w-md mx-auto">
                        Looks like you haven't added anything to your cart yet. Explore our fresh categories and start shopping!
                    </p>
                    <Link to="/" className="btn-primary px-10 rounded-xl">Start Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-main-bg">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center space-x-2 text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] mb-4">
                    <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
                    <ChevronRight size={10} strokeWidth={3} />
                    <span className="text-text-primary">Shopping Cart</span>
                </div>

                <h1 className="text-3xl font-bold text-text-primary mb-10 tracking-tight">Your Basket ({items.length} items)</h1>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-12">
                    {/* Cart Items */}
                    <div className="flex-1 space-y-4 md:space-y-6 md:mb-0 mb-32">
                        <AnimatePresence>
                            {items.map((item) => (
                                <motion.div
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-white rounded-xl md:rounded-md p-4 md:p-6 shadow-sm md:shadow-card border border-gray-100 flex items-center space-x-4 md:space-x-6 relative"
                                >
                                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-lg md:rounded-md overflow-hidden shrink-0 border border-gray-100">
                                        <img 
                                            src={getImageUrl(item.images?.[0] || item.image)} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => e.target.src = '/placeholder-product.png'}
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="pr-8">
                                                <h3 className="font-bold text-gray-800 text-sm md:text-lg line-clamp-2 md:line-clamp-1">{item.name}</h3>
                                                <p className="text-[10px] md:text-xs text-text-muted font-medium mt-1">{item.weight} {item.unit}</p>
                                            </div>
                                            <button
                                                onClick={() => dispatch(deleteFromCart(item._id))}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-2 md:p-1 absolute top-2 right-2 md:relative md:top-auto md:right-auto tap-target"
                                            >
                                                <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-end mt-2 md:mt-4">
                                            <div className="text-left">
                                                <p className="text-sm md:text-lg font-heading font-extrabold text-gray-800">₹{item.price * item.quantity}</p>
                                                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-tighter">₹{item.price} / unit</p>
                                            </div>
                                            <div className="flex items-center bg-gray-50 rounded-md p-1 border border-gray-100 tap-target">
                                                <button
                                                    onClick={() => dispatch(removeFromCart(item._id))}
                                                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-gray-600 active:bg-white md:hover:bg-white md:hover:text-brand-primary rounded transition-all shadow-sm"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 md:w-10 text-center text-xs md:text-base font-bold text-gray-800">{item.quantity}</span>
                                                <button
                                                    onClick={() => dispatch(addToCart(item))}
                                                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-gray-600 active:bg-white md:hover:bg-white md:hover:text-brand-primary rounded transition-all shadow-sm"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary & Bill Details */}
                    <aside className="w-full lg:w-96 space-y-4 md:space-y-6">
                        {/* Coupon Section */}
                        <div className="bg-white rounded-xl md:rounded-md p-4 md:p-6 shadow-sm md:shadow-card border border-gray-100">
                            <div className="flex items-center space-x-2 mb-3 md:mb-4">
                                <Ticket className="text-brand-primary" size={18} />
                                <h4 className="font-bold text-gray-800 uppercase text-[10px] md:text-xs tracking-widest">Coupons & Offers</h4>
                            </div>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Enter coupon code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-lg md:rounded-md px-4 py-3 md:py-2 text-xs md:text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-brand-primary/20 tap-target"
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={isValidating || !couponCode}
                                    className="bg-brand-primary text-white text-[10px] md:text-xs font-bold px-4 md:px-6 py-2 rounded-lg md:rounded-md active:bg-brand-secondary md:hover:bg-brand-secondary transition-all disabled:opacity-50 tap-target shadow-md shadow-brand-primary/20"
                                >
                                    {isValidating ? '...' : 'APPLY'}
                                </button>
                            </div>
                            {appliedCoupon && (
                                <div className="mt-3 flex items-center justify-between bg-green-50 p-2 md:p-3 rounded-lg md:rounded border border-green-100">
                                    <span className="text-[10px] md:text-xs font-bold text-green-700 uppercase tracking-widest">Coupon Applied!</span>
                                    <button onClick={() => { setAppliedCoupon(null); setDiscount(0); }} className="text-green-700 font-bold text-[10px] md:text-xs underline p-1 tap-target">Remove</button>
                                </div>
                            )}
                        </div>

                        {/* Desktop Bill Details */}
                        <div className="hidden md:block bg-white rounded-md p-8 shadow-card border border-gray-100">
                            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-widest mb-6 border-b border-gray-50 pb-4">Bill Details</h4>
                            <div className="space-y-4 text-sm mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Item Total</span>
                                    <span className="font-bold text-gray-800">₹{totalAmount}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between items-center text-green-600">
                                        <span className="font-medium">Coupon Discount</span>
                                        <span className="font-bold">-₹{discount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-1">
                                        <span className="text-gray-500 font-medium">Delivery Fee</span>
                                        <Info size={14} className="text-gray-300" />
                                    </div>
                                    <span className={`font-bold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Handling & GST (5%)</span>
                                    <span className="font-bold text-gray-800">₹{gst}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-10 pt-6 border-t border-gray-100">
                                <span className="text-lg font-heading font-extrabold text-gray-800">Grand Total</span>
                                <span className="text-2xl font-heading font-extrabold text-brand-primary">₹{finalTotal}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full btn-primary flex items-center justify-center space-x-3 !py-4 group"
                            >
                                <span className="text-lg">Checkout</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="mt-6 text-[10px] text-center text-gray-400 leading-relaxed font-bold uppercase tracking-widest">
                                Safe and secure payments • 100% Authentic products • 10-minute delivery
                            </p>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Mobile Fixed Bill Summary & Checkout */}
            <div className="md:hidden fixed bottom-[64px] left-0 w-full bg-white border-t border-gray-100 p-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[32px] space-y-4">
                {/* Collapsible details for mobile could be added here, kept simple for now */}
                <div className="flex justify-between items-center bg-brand-bg-light p-4 rounded-2xl border border-brand-primary/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-brand-primary/60 uppercase tracking-widest">To Pay</span>
                        <span className="text-xl font-bold text-text-primary leading-none">₹{finalTotal}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                         <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest px-2 py-0.5 bg-white rounded-md mb-0.5">Includes {gst} GST & {deliveryFee===0?'Free':`₹${deliveryFee}`} Del</span>
                         {discount > 0 && <span className="text-[9px] font-black text-green-600 uppercase tracking-widest mt-1">Saved ₹{discount}</span>}
                    </div>
                </div>

                <button
                    onClick={handleCheckout}
                    className="w-full bg-brand-primary text-white font-black py-4.5 px-6 rounded-2xl shadow-xl shadow-brand-primary/20 flex items-center justify-between tap-target active:scale-[0.98] transition-all"
                >
                    <span className="text-sm uppercase tracking-widest">Proceed to Checkout</span>
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default CartPage;
