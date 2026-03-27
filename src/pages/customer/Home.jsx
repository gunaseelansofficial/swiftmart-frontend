import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../../store/slices/categorySlice';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/shared/Navbar';
import { ChevronRight, ArrowRight, RefreshCw, Search, ChevronLeft, AlertCircle, RotateCcw } from 'lucide-react';
import api from '../../utils/api';
import ProductCard from '../../components/shared/ProductCard';
import { getImageUrl } from '../../utils/imageHelper';

// FIX 2: Error state UI component
const ErrorState = ({ onRetry, message = "Couldn't load products" }) => (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
        <AlertCircle className="text-gray-300" size={32} />
        <p className="text-sm text-text-secondary ">{message}</p>
        <button
            onClick={onRetry}
            className="flex items-center space-x-1.5 text-xs font-bold text-brand-primary border border-brand-primary/30 px-4 py-2 rounded-lg hover:bg-brand-primary/5 transition-colors"
        >
            <RotateCcw size={12} />
            <span>Try again</span>
        </button>
    </div>
);

// FIX 1 & 2 & 4: ProductStrip with per-section loading, error state, and correct View All links
const ProductStrip = ({ title, products, loading, error, onRetry, link }) => (
    <section className="mb-12 md:mb-16">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                    {title}
                </h3>
            </div>
            {/* FIX 4: Each strip links to its own filtered URL, not a generic /category/all */}
            <Link
                to={link || "/category/all"}
                className="flex items-center space-x-1.5 text-xs font-bold text-brand-primary uppercase tracking-wider hover:text-brand-primary/80 transition-colors group"
            >
                <span>View All</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
        </div>

        {/* FIX 2: Show error state when fetch fails */}
        {error ? (
            <ErrorState onRetry={onRetry} />
        ) : (
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
                ) : products.length === 0 ? (
                    // FIX 2: Empty state when no products returned
                    <div className="flex items-center justify-center w-full py-10">
                        <p className="text-sm text-text-secondary ">No products available right now.</p>
                    </div>
                ) : (
                    products.map((product) => (
                        <div key={product._id} className="min-w-[160px] max-w-[160px] md:min-w-[250px] md:max-w-[250px]">
                            <ProductCard product={product} />
                        </div>
                    ))
                )}
            </div>
        )}
    </section>
);

const Home = () => {
    const dispatch = useDispatch();
    const { items: categories, loading: categoriesLoading } = useSelector(state => state.categories);

    const [freshProducts, setFreshProducts] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [homePageProducts, setHomePageProducts] = useState([]);
    const [banners, setBanners] = useState([]);

    // FIX 1: Per-section loading states instead of one shared boolean
    const [loadingFresh, setLoadingFresh] = useState(true);
    const [loadingBestSellers, setLoadingBestSellers] = useState(true);
    const [loadingHomePage, setLoadingHomePage] = useState(true);
    const [bannersLoading, setBannersLoading] = useState(true);

    // FIX 2: Per-section error states
    const [errorFresh, setErrorFresh] = useState(false);
    const [errorBestSellers, setErrorBestSellers] = useState(false);
    const [errorHomePage, setErrorHomePage] = useState(false);
    const [errorBanners, setErrorBanners] = useState(false);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDist, setPullDist] = useState(0);
    const [startY, setStartY] = useState(0);

    // FIX 3: activeBanner is now actually used for a working carousel indicator
    const [activeBanner, setActiveBanner] = useState(0);

    const categoryScrollRef = useRef(null);

    useEffect(() => {
        dispatch(fetchCategories());
        fetchHomeProducts();
        fetchBanners();
    }, [dispatch]);

    // FIX 3: activeBanner drives the visible banner on mobile carousel
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
            const scrollTo = direction === 'left'
                ? scrollLeft - clientWidth * 0.8
                : scrollLeft + clientWidth * 0.8;
            categoryScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    const fetchBanners = async () => {
        setBannersLoading(true);
        setErrorBanners(false);
        try {
            const { data } = await api.get('/banners');
            setBanners(data.banners);
        } catch (error) {
            console.error('Error fetching banners');
            setErrorBanners(true);
        } finally {
            setBannersLoading(false);
        }
    };

    // FIX 1 & 2: Each section loads and errors independently
    const fetchHomeProducts = async () => {
        setLoadingFresh(true);
        setLoadingBestSellers(true);
        setLoadingHomePage(true);
        setErrorFresh(false);
        setErrorBestSellers(false);
        setErrorHomePage(false);

        const [freshResult, bestResult, featuredResult] = await Promise.allSettled([
            api.get('/products?sort=newest&limit=8&inStock=true'),
            api.get('/products?sort=relevance&limit=8'),
            api.get('/products?isHomePage=true&limit=8')
        ]);

        if (freshResult.status === 'fulfilled') {
            setFreshProducts(freshResult.value.data.products);
        } else {
            setErrorFresh(true);
        }
        setLoadingFresh(false);

        if (bestResult.status === 'fulfilled') {
            setBestSellers(bestResult.value.data.products);
        } else {
            setErrorBestSellers(true);
        }
        setLoadingBestSellers(false);

        if (featuredResult.status === 'fulfilled') {
            setHomePageProducts(featuredResult.value.data.products);
        } else {
            setErrorHomePage(true);
        }
        setLoadingHomePage(false);

        if (isRefreshing) setIsRefreshing(false);
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

    return (
        <div
            className="min-h-screen bg-light-bg transition-colors"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <Navbar />

            {/* Pull to Refresh Indicator */}
            {pullDist > 0 && (
                <div
                    className="flex justify-center -mt-4 mb-4 md:hidden transition-transform"
                    style={{ transform: `translateY(${Math.min(pullDist, 80)}px)` }}
                >
                    <div className="bg-white rounded-full p-2 shadow-lg">
                        <RefreshCw
                            className={`text-brand-primary ${isRefreshing ? 'animate-spin' : ''}`}
                            size={24}
                            style={{ transform: `rotate(${pullDist * 2}deg)` }}
                        />
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">

                {/* Mobile Search Bar */}
                <div className="mb-6 md:hidden relative z-10 w-full">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search for 'milk', 'eggs'..."
                            className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-sm text-sm h-12 text-text-primary "
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    window.location.href = `/search?q=${encodeURIComponent(e.target.value)}`;
                                }
                            }}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary transition-colors" size={20} />
                    </div>
                </div>

                {/* Categories Section */}
                <section className="mb-10 md:mb-16 relative group/slider">
                    <div className="flex justify-between items-end mb-6 md:mb-8">
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">Shop by Category</h3>
                            <p className="text-xs md:text-sm text-text-secondary hidden md:block mt-1">Explore our wide range of products</p>
                        </div>
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

                    <div
                        ref={categoryScrollRef}
                        className="flex overflow-x-auto pb-4 space-x-4 md:space-x-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mobile-touch-scroll no-scrollbar scroll-smooth"
                    >
                        {categoriesLoading ? (
                            Array(8).fill(0).map((_, i) => (
                                <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-24 md:h-32 min-w-[100px] md:min-w-[140px] shadow-sm" />
                            ))
                        ) : (
                            categories.map((cat) => (
                                <Link
                                    to={`/category/${cat.slug}`}
                                    key={cat._id}
                                    className="block min-w-[80px] md:min-w-[140px] snap-center md:snap-start"
                                >
                                    <div className="flex flex-col items-center justify-center text-center group/cat">
                                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-white mb-3 shadow-sm border border-card-border group-hover/cat:scale-105 transition-transform">
                                            <img
                                                src={getImageUrl(cat.image)}
                                                className="w-full h-full object-cover"
                                                alt={cat.name}
                                                onError={(e) => e.target.src = '/placeholder-product.png'}
                                            />
                                        </div>
                                        <span className="text-[10px] md:text-xs font-bold text-text-primary uppercase tracking-wide line-clamp-1">{cat.name}</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                {/* Hero Banner Section */}
                <section className="mb-12 md:mb-20">
                    {bannersLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            <div className="aspect-[21/9] bg-gray-100 animate-pulse rounded-2xl md:rounded-[32px]" />
                            <div className="aspect-[21/9] bg-gray-100 animate-pulse rounded-2xl md:rounded-[32px]" />
                        </div>
                    ) : errorBanners ? (
                        // FIX 2: Banner error state with retry
                        <div className="rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center space-y-3">
                            <AlertCircle className="text-gray-300" size={32} />
                            <p className="text-sm text-text-secondary ">Couldn't load banners</p>
                            <button
                                onClick={fetchBanners}
                                className="flex items-center space-x-1.5 text-xs font-bold text-brand-primary border border-brand-primary/30 px-4 py-2 rounded-lg hover:bg-brand-primary/5 transition-colors"
                            >
                                <RotateCcw size={12} />
                                <span>Try again</span>
                            </button>
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
                                    <h1 className="text-2xl md:text-6xl font-heading font-extrabold text-white mb-4 leading-tight">
                                        Fresh Grocery Delivery <br />
                                        <span className="text-brand-primary">In 10 Minutes</span>
                                    </h1>
                                    <Link to="/category/all" className="inline-flex bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-secondary transition-all">
                                        Shop Now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* FIX 3: Desktop — side-by-side dual banners (unchanged) */}
                            <div className="hidden md:grid grid-cols-2 gap-6 md:gap-10">
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

                            {/* FIX 3: Mobile — swipeable carousel with working dot indicator */}
                            <div className="md:hidden relative">
                                <div className="overflow-hidden rounded-2xl">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeBanner}
                                            initial={{ opacity: 0, x: 40 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -40 }}
                                            transition={{ duration: 0.3 }}
                                            className="relative aspect-[21/9] shadow-xl"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                                            <img
                                                src={getImageUrl(banners[activeBanner]?.image)}
                                                className="absolute inset-0 w-full h-full object-cover"
                                                alt={banners[activeBanner]?.title}
                                                onError={(e) => e.target.src = '/placeholder-banner.png'}
                                            />
                                            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6">
                                                <h2 className="text-xl font-heading font-black text-white mb-4 drop-shadow-lg uppercase italic tracking-tighter max-w-[80%] leading-none">
                                                    {banners[activeBanner]?.title}
                                                </h2>
                                                {banners[activeBanner]?.link && (
                                                    <Link
                                                        to={banners[activeBanner].link}
                                                        className="inline-flex items-center space-x-2 bg-white text-navy-dark px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg w-fit"
                                                    >
                                                        <span>Get Offer</span>
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                )}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* FIX 3: Dot indicators wired to activeBanner */}
                                {banners.length > 1 && (
                                    <div className="flex justify-center space-x-2 mt-3">
                                        {banners.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveBanner(idx)}
                                                className={`rounded-full transition-all ${idx === activeBanner
                                                        ? 'w-5 h-2 bg-brand-primary'
                                                        : 'w-2 h-2 bg-gray-300 '
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>

                {/* Featured Products — FIX 4: links to ?isHomePage=true filtered view */}
                {(!loadingHomePage && homePageProducts.length > 0) || loadingHomePage || errorHomePage ? (
                    <ProductStrip
                        title="🌟 Featured on Home"
                        products={homePageProducts}
                        loading={loadingHomePage}
                        error={errorHomePage}
                        onRetry={fetchHomeProducts}
                        link="/products?isHomePage=true"
                    />
                ) : null}

                {/* FIX 4: Fresh & New links to newest sort */}
                <ProductStrip
                    title="🌿 Fresh & New"
                    products={freshProducts}
                    loading={loadingFresh}
                    error={errorFresh}
                    onRetry={fetchHomeProducts}
                    link="/products?sort=newest&inStock=true"
                />

                {/* FIX 4: Best Sellers links to relevance/bestseller sort */}
                <ProductStrip
                    title="🔥 Best Sellers"
                    products={bestSellers}
                    loading={loadingBestSellers}
                    error={errorBestSellers}
                    onRetry={fetchHomeProducts}
                    link="/products?sort=relevance"
                />

            </main>
        </div>
    );
};

export default Home;
