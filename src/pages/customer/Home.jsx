import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../../store/slices/categorySlice';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/shared/Navbar';
import { ChevronRight, ArrowRight, RefreshCw, Search, ChevronLeft } from 'lucide-react';
import api from '../../utils/api';
import ProductCard from '../../components/shared/ProductCard';
import { getImageUrl } from '../../utils/imageHelper';

const Home = () => {
    const dispatch = useDispatch();
    const { items: categories, loading: categoriesLoading } = useSelector(state => state.categories);
    const [freshProducts, setFreshProducts] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [banners, setBanners] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [bannersLoading, setBannersLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDist, setPullDist] = useState(0);
    const [startY, setStartY] = useState(0);
    const [activeBanner, setActiveBanner] = useState(0);
    const categoryScrollRef = useRef(null);

    useEffect(() => {
        dispatch(fetchCategories());
        fetchHomeProducts();
        fetchBanners();
    }, [dispatch]);

    useEffect(() => {
        if (banners.length > 0) {
            const timer = setInterval(() => {
                setActiveBanner(prev => (prev + 1) % banners.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [banners]);

    const scrollCategories = (direction) => {
        if (categoryScrollRef.current) {
            const { scrollLeft, clientWidth } = categoryScrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
            categoryScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    const fetchBanners = async () => {
        try {
            const { data } = await api.get('/banners');
            setBanners(data.banners);
        } catch (error) {
            console.error('Error fetching banners');
        } finally {
            setBannersLoading(false);
        }
    };

    const fetchHomeProducts = async () => {
        setLoadingProducts(true);
        try {
            const [freshRes, bestRes] = await Promise.all([
                api.get('/products?sort=newest&limit=8&inStock=true'),
                api.get('/products?sort=relevance&limit=8')
            ]);
            setFreshProducts(freshRes.data.products);
            setBestSellers(bestRes.data.products);
        } catch (error) {
            console.error('Error fetching home products');
        } finally {
            setLoadingProducts(false);
            if (isRefreshing) setIsRefreshing(false);
        }
    };

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (startY > 0) {
            const currentY = e.touches[0].clientY;
            let dist = currentY - startY;
            if (dist > 0 && dist < 150) setPullDist(dist);
        }
    };

    const handleTouchEnd = () => {
        if (pullDist > 80) {
            setIsRefreshing(true);
            dispatch(fetchCategories());
            fetchHomeProducts();
            fetchBanners();
        }
        setStartY(0);
        setPullDist(0);
    };

    const ProductStrip = ({ title, products, loading, link }) => (
        <section className="mb-16">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-heading font-extrabold text-[#1A1A2E] flex items-center">
                        {title}
                    </h3>
                </div>
                <Link to={link || "/category/all"} className="flex items-center space-x-2 text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline group">
                    <span>View All</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
            <div className="flex overflow-x-auto pb-6 space-x-4 md:space-x-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mobile-touch-scroll no-scrollbar">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="min-w-[160px] md:min-w-[250px] bg-white rounded-md p-4 space-y-4 shadow-card">
                            <div className="aspect-square bg-gray-100 animate-pulse rounded-md" />
                            <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                            <div className="h-4 bg-gray-100 animate-pulse rounded w-1/2" />
                            <div className="h-10 bg-gray-100 animate-pulse rounded w-full" />
                        </div>
                    ))
                ) : (
                    products.map((product) => (
                        <div key={product._id} className="min-w-[160px] max-w-[160px] md:min-w-[250px] md:max-w-[250px]">
                            <ProductCard product={product} />
                        </div>
                    ))
                )}
            </div>
        </section>
    );

    return (
        <div
            className="min-h-screen bg-light-bg"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <Navbar />

            {/* Pull to Refresh Indicator */}
            {pullDist > 0 && (
                <div className="flex justify-center -mt-4 mb-4 md:hidden transition-transform" style={{ transform: `translateY(${Math.min(pullDist, 80)}px)` }}>
                    <div className="bg-white rounded-full p-2 shadow-lg">
                        <RefreshCw className={`text-brand-primary ${isRefreshing ? 'animate-spin' : ''}`} size={24} style={{ transform: `rotate(${pullDist * 2}deg)` }} />
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Mobile Search Bar Component (Now at top for quick access) */}
                <div className="mb-6 md:hidden relative relative z-10 w-full">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search for 'milk', 'eggs'..."
                            className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-sm text-sm h-12"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    window.location.href = `/search?q=${encodeURIComponent(e.target.value)}`;
                                }
                            }}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary transition-colors" size={20} />
                    </div>
                </div>

                {/* Categories Section - Now FIRST as requested */}
                <section className="mb-8 md:mb-12 relative group/slider">
                    <div className="flex justify-between items-end mb-4 md:mb-8">
                        <div>
                            <h3 className="text-xl md:text-2xl font-heading font-extrabold text-[#1A1A2E]">Shop by Category</h3>
                            <p className="text-xs md:text-sm text-text-muted hidden md:block">Explore our wide range of freshness</p>
                        </div>
                        {/* Desktop Navigation Buttons */}
                        <div className="hidden md:flex space-x-2">
                            <button
                                onClick={() => scrollCategories('left')}
                                className="p-2 rounded-full bg-white shadow-md border border-gray-100 text-gray-400 hover:text-brand-primary hover:shadow-lg transition-all active:scale-95"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => scrollCategories('right')}
                                className="p-2 rounded-full bg-white shadow-md border border-gray-100 text-gray-400 hover:text-brand-primary hover:shadow-lg transition-all active:scale-95"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Horizontal scroll container for categories */}
                    <div
                        ref={categoryScrollRef}
                        className="flex overflow-x-auto pb-4 space-x-4 md:space-x-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mobile-touch-scroll no-scrollbar snap-x snap-mandatory scroll-smooth"
                    >
                        {categoriesLoading ? (
                            Array(8).fill(0).map((_, i) => (
                                <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-24 md:h-32 min-w-[100px] md:min-w-[140px] shadow-sm" />
                            ))
                        ) : (
                            categories.map((cat, idx) => (
                                <Link
                                    to={`/category/${cat.slug}`}
                                    key={cat._id}
                                    className="block min-w-[80px] md:min-w-[140px] snap-center md:snap-start"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -5, scale: 1.05 }}
                                        className="flex flex-col items-center justify-center text-center group/cat"
                                    >
                                        <div className="w-16 h-16 md:w-28 md:h-28 rounded-full md:rounded-3xl overflow-hidden bg-white mb-3 shadow-md md:shadow-card group-hover/cat:shadow-xl transition-all border-2 border-transparent group-hover/cat:border-brand-primary/20 p-2 md:p-3">
                                            <img
                                                src={getImageUrl(cat.image)}
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover/cat:scale-110"
                                                alt={cat.name}
                                                onError={(e) => e.target.src = '/placeholder-product.png'}
                                            />
                                        </div>
                                        <span className="text-[10px] md:text-sm font-bold text-gray-700 uppercase tracking-tight line-clamp-1">{cat.name}</span>
                                    </motion.div>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                {/* Hero Section - Dual Banners - Second as requested */}
                <section className="mb-12 md:mb-20">
                    {bannersLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            <div className="aspect-[21/9] bg-gray-100 animate-pulse rounded-2xl md:rounded-[32px]" />
                            <div className="aspect-[21/9] bg-gray-100 animate-pulse rounded-2xl md:rounded-[32px]" />
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="relative rounded-2xl md:rounded-[40px] overflow-hidden aspect-[21/9] md:h-[450px] bg-navy-dark shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy-dark/60 to-transparent z-10" />
                            <img
                                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1974"
                                className="absolute inset-0 w-full h-full object-cover"
                                alt="Hero"
                            />
                            <div className="relative z-20 px-8 md:px-16 flex items-center h-full max-w-2xl">
                                <div>
                                    <h1 className="text-2xl md:text-6xl font-heading font-extrabold text-white mb-4 leading-tight">Fresh Grocery Delivery <br /><span className="text-brand-primary">In 10 Minutes</span></h1>
                                    <Link to="/category/all" className="inline-flex bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-secondary transition-all">Shop Now</Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                            {banners.slice(0, 2).map((banner, idx) => (
                                <motion.div
                                    key={banner._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.2 }}
                                    className="relative rounded-2xl md:rounded-[32px] overflow-hidden aspect-[21/9] md:aspect-auto md:h-[320px] shadow-xl hover:shadow-2xl transition-all group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/70 via-black/20 to-transparent z-10" />
                                    <img
                                        src={getImageUrl(banner.image)}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt={banner.title}
                                        onError={(e) => e.target.src = '/placeholder-banner.png'}
                                    />
                                    <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-10">
                                        <h2 className="text-xl md:text-3xl font-heading font-black text-white mb-4 drop-shadow-lg uppercase italic tracking-tighter max-w-[80%] leading-none">
                                            {banner.title}
                                        </h2>
                                        {banner.link && (
                                            <div>
                                                <Link
                                                    to={banner.link}
                                                    className="inline-flex items-center space-x-2 bg-white text-navy-dark px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-brand-primary hover:text-white transition-all transform hover:scale-105"
                                                >
                                                    <span>Get Offer</span>
                                                    <ArrowRight size={14} />
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* BUG 1: Fresh & New Section */}
                <ProductStrip
                    title="🌿 Fresh & New"
                    products={freshProducts}
                    loading={loadingProducts}
                    link="/category/all"
                />

                {/* BUG 1: Best Sellers Section */}
                <ProductStrip
                    title="🔥 Best Sellers"
                    products={bestSellers}
                    loading={loadingProducts}
                    link="/category/all"
                />

                {/* Promo Section */}
                <section className="bg-navy-dark rounded-2xl md:rounded-3xl p-8 md:p-16 text-center border-2 md:border-4 border-brand-primary/20 shadow-xl relative overflow-hidden group mb-4">
                    <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <h3 className="text-2xl md:text-5xl font-heading font-extrabold text-white mb-4 md:mb-6 uppercase tracking-tighter italic">Handpicked Freshness!</h3>
                    <p className="text-sm md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 md:mb-12">
                        From hand-picked organic fruits to artisanal dairy, we bring the best of the market straight to your kitchen.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:flex md:flex-wrap md:justify-center md:gap-6">
                        <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 w-full md:w-40 hover:bg-white/20 transition-all cursor-default group/item flex flex-row sm:flex-col items-center justify-center space-x-4 sm:space-x-0">
                            <div className="text-3xl md:text-4xl sm:mb-3 md:group-hover/item:scale-125 transition-transform">🍎</div>
                            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">100% FRESH</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 w-full md:w-40 hover:bg-white/20 transition-all cursor-default group/item flex flex-row sm:flex-col items-center justify-center space-x-4 sm:space-x-0">
                            <div className="text-3xl md:text-4xl sm:mb-3 md:group-hover/item:scale-125 transition-transform">🥦</div>
                            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">ORGANIC</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 w-full md:w-40 hover:bg-white/20 transition-all cursor-default group/item flex flex-row sm:flex-col items-center justify-center space-x-4 sm:space-x-0">
                            <div className="text-3xl md:text-4xl sm:mb-3 md:group-hover/item:scale-125 transition-transform">🥛</div>
                            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">PURE DAIRY</div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
