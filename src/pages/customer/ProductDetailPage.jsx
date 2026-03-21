import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ShoppingBag,
    Heart,
    Minus,
    Plus,
    MapPin,
    Truck,
    ShieldCheck,
    ChevronRight,
    ChevronDown,
    Star,
    Clock,
    Zap,
    ChevronLeft,
    CheckCircle2,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/shared/Navbar';
import api from '../../utils/api';
import { addToCart, removeFromCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageHelper';

const ProductDetailPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const cartItems = useSelector((state) => state.cart.items);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [pincode, setPincode] = useState('');
    const [deliveryStatus, setDeliveryStatus] = useState(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchProductDetails();
    }, [id]);

    const fetchProductDetails = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/products/${id}`);
            setProduct(data.product);

            const relatedData = await api.get(`/products/${id}/related`);
            setRelatedProducts(relatedData.data.products);
        } catch (error) {
            toast.error('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const checkPincode = (e) => {
        e.preventDefault();
        if (pincode.length === 6) {
            setDeliveryStatus('Delivery in 10 mins');
        } else {
            toast.error('Enter a valid 6-digit pincode');
        }
    };

    const quantity = cartItems.find(item => item._id === id)?.quantity || 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 animate-pulse">
                    <div className="w-full md:w-[42%] aspect-square bg-gray-50 rounded-2xl" />
                    <div className="flex-1 space-y-8">
                        <div className="h-10 bg-gray-50 rounded w-3/4" />
                        <div className="h-4 bg-gray-50 rounded w-1/4" />
                        <div className="h-40 bg-gray-50 rounded" />
                        <div className="h-14 bg-gray-50 rounded w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="min-h-screen bg-white font-body">
            <Navbar />

            <main className="max-w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
                {/* Breadcrumbs - Desktop Only */}
                <div className="hidden lg:flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">
                    <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
                    <ChevronRight size={10} strokeWidth={3} />
                    <Link to={`/category/${product.category?.slug}`} className="hover:text-brand-primary transition-colors">{product.category?.name}</Link>
                    <ChevronRight size={10} strokeWidth={3} />
                    <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
                </div>

                {/* Mobile Back Button */}
                <div className="lg:hidden mb-4">
                    <Link to={-1} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-800">
                        <ChevronLeft size={20} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[42%_58%] gap-12 items-start">
                    {/* Left: Image Gallery Section */}
                    <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4">
                        {/* Thumbnails - Left Side on Desktop, Bottom on Mobile */}
                        {product.images && product.images.length > 0 && (
                            <div className="order-2 lg:order-1 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:h-full lg:max-w-[80px]">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`shrink-0 w-20 lg:w-full aspect-square rounded-2xl border-2 transition-all p-2 bg-white overflow-hidden ${selectedImage === idx ? 'border-brand-primary shadow-lg shadow-brand-primary/10 scale-105' : 'border-gray-50 hover:border-gray-200'
                                            }`}
                                    >
                                        <img
                                            src={getImageUrl(img)}
                                            alt={`${product.name} ${idx + 1}`}
                                            className="w-full h-full object-contain"
                                            onError={(e) => e.target.src = '/placeholder-product.png'}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Main Large Image */}
                        <div className="order-1 lg:order-2 flex-1 bg-white rounded-2xl lg:rounded-[32px] border border-gray-100 overflow-hidden relative group aspect-square lg:aspect-auto">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={selectedImage}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 0.3 }}
                                    src={getImageUrl(product.images?.[selectedImage] || product.image)}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-8 lg:p-12"
                                    onError={(e) => e.target.src = '/placeholder-product.png'}
                                />
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right: Scrollable Info Column */}
                    <div className="space-y-10 lg:pl-4">
                        {/* Title & Stats */}
                        <section className="space-y-4">
                            <div>
                                <h1 className="text-3xl lg:text-5xl font-black text-gray-900 leading-[1.1] mb-2">{product.name}</h1>
                                {product.netQuantity && (
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Net Quantity: {product.netQuantity}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center px-3 py-1.5 bg-yellow-50 rounded-lg text-yellow-600 space-x-1.5">
                                    <Star size={14} className="fill-yellow-600" />
                                    <span className="text-sm font-black">{product.rating?.avg || '4.8'}</span>
                                    <span className="text-yellow-400 font-bold px-1">•</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{product.rating?.count || '254'} Reviews</span>
                                </div>
                                <div className="h-4 w-[1px] bg-gray-100" />
                                <button
                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                    className="flex items-center space-x-1 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Heart size={16} className={`${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isWishlisted ? 'text-red-500' : 'text-gray-400'}`}>
                                        {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                                    </span>
                                </button>
                            </div>

                            <div className="pt-4 flex items-center space-x-4">
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-4xl lg:text-5xl font-black text-gray-900">₹{product.price}</span>
                                    <span className="text-lg text-gray-400 line-through">₹{product.mrp}</span>
                                </div>
                                <span className="bg-green-500 text-white text-[10px] font-black px-3 py-2 rounded-lg uppercase tracking-widest shadow-lg shadow-green-500/20">
                                    {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                                </span>
                            </div>

                            {/* Desktop Add to Cart - Moved here for better flow */}
                            <div className="hidden lg:block pt-6">
                                {quantity === 0 ? (
                                    <button
                                        onClick={() => {
                                            dispatch(addToCart(product));
                                            toast.success('Added to Basket');
                                        }}
                                        disabled={product.stock <= 0}
                                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 shadow-xl shadow-brand-primary/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-[30deg] -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-in-out" />
                                        <ShoppingBag size={20} />
                                        <span>Add to Basket</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1 flex items-center bg-gray-900 rounded-2xl p-1.5 justify-between">
                                            <button onClick={() => dispatch(removeFromCart(product._id))} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors">
                                                <Minus size={20} strokeWidth={3} />
                                            </button>
                                            <span className="text-white text-xl font-black">{quantity}</span>
                                            <button onClick={() => dispatch(addToCart(product))} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors">
                                                <Plus size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <Link to="/cart" className="px-8 h-14 bg-brand-primary/10 text-brand-primary font-black rounded-2xl flex items-center justify-center hover:bg-brand-primary/20 transition-all uppercase tracking-widest text-xs">
                                            View Cart
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Delivery Estimate & Pincode Checker */}
                        <section className="p-4 md:p-6 bg-gray-50/50 rounded-2xl md:rounded-3xl border border-gray-100 border-dashed space-y-4 md:space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-primary shadow-sm hover:scale-110 transition-transform">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Estimated Delivery</p>
                                        <p className="text-sm font-black text-gray-900">10 - 15 Minutes</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm cursor-pointer hover:border-brand-primary transition-all group">
                                    <MapPin size={14} className="text-brand-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                        {pincode.length === 6 ? `Delivering to ${pincode}` : 'Select Location'}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={checkPincode} className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-primary transition-colors">
                                    <MapPin size={18} />
                                </div>
                                <input
                                    type="text"
                                    maxLength="6"
                                    placeholder="Enter 6-digit Pincode"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-white border border-gray-100 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-20 md:pr-24 py-3 md:py-4 text-xs md:text-sm font-bold focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary focus:outline-none transition-all placeholder:text-gray-300 tap-target"
                                />
                                <button type="submit" className="absolute right-2 top-1.5 bottom-1.5 px-4 md:px-6 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl hover:bg-brand-primary transition-colors shadow-lg shadow-gray-900/10 tap-target">
                                    Check
                                </button>
                            </form>

                            {deliveryStatus && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100"
                                >
                                    <CheckCircle2 size={18} />
                                    <span className="text-xs font-black uppercase tracking-widest">{deliveryStatus}</span>
                                </motion.div>
                            )}
                        </section>

                        {/* Coupons & Offers */}
                        {product.offers && product.offers.length > 0 && (
                            <section className="bg-white rounded-[32px] border border-gray-100 p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center space-x-2">
                                        <Zap size={16} className="text-brand-primary fill-brand-primary" />
                                        <span>Available Coupons & Offers</span>
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    {product.offers.map((offer, idx) => (
                                        <div key={idx} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 p-2 rounded-xl transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm bg-white" style={{ color: offer.color }}>
                                                    <Zap size={16} fill={offer.color} />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">{offer.text}</span>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full pt-4 border-t border-gray-50 text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline text-center">
                                    View All Coupons
                                </button>
                            </section>
                        )}

                        {/* Trust Badges */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            {product.easyRefunds && (
                                <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-[32px] border border-gray-100 flex items-center space-x-4 shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><ShieldCheck size={28} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-widest">7 Day Returns</span>
                                        <span className="text-[10px] font-bold text-gray-400">Easy & Instant Refunds</span>
                                    </div>
                                </div>
                            )}
                            {product.fastDelivery && (
                                <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-[32px] border border-gray-100 flex items-center space-x-4 shadow-sm">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-50 flex items-center justify-center text-brand-primary"><Truck size={24} className="md:w-7 md:h-7" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Flash Delivery</span>
                                        <span className="text-[10px] font-bold text-gray-400">Under 15 Minutes</span>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Highlights (Table) */}
                        {product.highlights && product.highlights.length > 0 && (
                            <section className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                                <div className="px-8 py-6 border-b border-gray-50 flex items-center space-x-3">
                                    <Info size={16} className="text-gray-400" />
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Product Highlights</h3>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {product.highlights.map((h, idx) => (
                                        <div key={idx} className={`grid grid-cols-2 px-8 py-5 items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{h.label}</span>
                                            <span className="text-sm font-bold text-gray-900">{h.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Description */}
                        <section className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-6">Description</h3>
                            <div className="relative">
                                <p className={`text-sm text-gray-600 leading-[1.8] font-medium transition-all duration-300 ${!isDescriptionExpanded ? 'max-h-24 overflow-hidden' : 'max-h-[1000px]'}`}>
                                    {product.description}
                                </p>
                                {product.description?.length > 150 && (
                                    <button
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="mt-4 text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center space-x-1"
                                    >
                                        <span>{isDescriptionExpanded ? 'Read Less' : 'Read More'}</span>
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${isDescriptionExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                )}
                                {!isDescriptionExpanded && product.description?.length > 150 && (
                                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                )}
                            </div>
                        </section>

                        {/* Information (Detailed Table) */}
                        {((product.information && product.information.length > 0) || product.shelfLife || product.countryOfOrigin || product.sellerName) && (
                            <section className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                                <div className="px-8 py-6 border-b border-gray-50">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Full Information</h3>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {product.shelfLife && (
                                        <div className="grid grid-cols-2 px-8 py-5 items-center bg-white">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shelf Life</span>
                                            <span className="text-sm font-bold text-gray-900">{product.shelfLife}</span>
                                        </div>
                                    )}
                                    {product.countryOfOrigin && (
                                        <div className="grid grid-cols-2 px-8 py-5 items-center bg-gray-50/30">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Origin</span>
                                            <span className="text-sm font-bold text-gray-900">{product.countryOfOrigin}</span>
                                        </div>
                                    )}
                                    {product.sellerName && (
                                        <div className="grid grid-cols-[1fr_2fr] px-8 py-5 items-start bg-white gap-4">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Seller</span>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-gray-900 leading-tight">{product.sellerName}</p>
                                                <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-wide">{product.sellerAddress}</p>
                                            </div>
                                        </div>
                                    )}
                                    {product.information?.map((info, idx) => (
                                        <div key={idx} className={`grid grid-cols-2 px-8 py-5 items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{info.label}</span>
                                            <span className="text-sm font-bold text-gray-900">{info.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Related Products */}
                        {relatedProducts.length > 0 && (
                            <section className="pt-10 pb-20 lg:pb-10 overflow-hidden">
                                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center space-x-3">
                                    <ShoppingBag size={24} className="text-brand-primary" />
                                    <span>People Also Bought</span>
                                </h3>
                                <div className="flex space-x-6 overflow-x-auto pb-8 snap-x no-scrollbar">
                                    {relatedProducts.map(p => (
                                        <Link
                                            key={p._id}
                                            to={`/product/${p._id}`}
                                            className="min-w-[240px] bg-white p-5 rounded-[24px] border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group snap-start"
                                        >
                                            <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden p-4">
                                                <img
                                                    src={getImageUrl(p.images?.[0] || p.image)}
                                                    alt={p.name}
                                                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => e.target.src = '/placeholder-product.png'}
                                                />
                                            </div>
                                            <h4 className="font-black text-gray-900 text-sm mb-1 truncate">{p.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">{p.weight} {p.unit}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-black text-gray-900">₹{p.price}</span>
                                                <button className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/20">
                                                    <Plus size={18} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Bar - Fixed - positioned above BottomNav */}
            <div className="lg:hidden fixed bottom-[60px] md:bottom-0 left-0 w-full bg-white border-t border-gray-100 p-3 md:p-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                {quantity === 0 ? (
                    <button
                        onClick={() => {
                            dispatch(addToCart(product));
                            toast.success('Added to Basket');
                        }}
                        disabled={product.stock <= 0}
                        className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all tap-target"
                    >
                        <ShoppingBag size={20} />
                        <span>Add to Basket • ₹{product.price}</span>
                    </button>
                ) : (
                    <div className="flex items-center space-x-4">
                        <div className="flex-1 flex items-center bg-gray-900 rounded-xl md:rounded-2xl p-1.5 justify-between">
                            <button onClick={() => dispatch(removeFromCart(product._id))} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white rounded-xl tap-target active:bg-white/20 transition-colors">
                                <Minus size={20} strokeWidth={3} />
                            </button>
                            <span className="text-white text-xl font-black">{quantity}</span>
                            <button onClick={() => dispatch(addToCart(product))} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white rounded-xl tap-target active:bg-white/20 transition-colors">
                                <Plus size={20} strokeWidth={3} />
                            </button>
                        </div>
                        <Link to="/cart" className="px-6 h-12 md:h-14 md:px-8 bg-brand-primary text-white font-black rounded-xl md:rounded-2xl flex items-center justify-center uppercase tracking-widest text-xs shadow-lg shadow-brand-primary/20 tap-target">
                            Check Bag
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPage;

