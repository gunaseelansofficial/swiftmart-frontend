import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Filter,
    ChevronDown,
    LayoutGrid,
    List,
    Search,
    ShoppingBag,
    Heart,
    Plus,
    Minus,
    Star,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/shared/Navbar';
import api from '../../utils/api';
import { addToCart, removeFromCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';
import ProductCard from '../../components/shared/ProductCard';
import BottomSheet from '../../components/shared/BottomSheet';

const ProductListingPage = () => {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    const cartItems = useSelector((state) => state.cart.items);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    // Filter States
    const [priceRange, setPriceRange] = useState([
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || 2000
    ]);
    const [selectedRating, setSelectedRating] = useState(searchParams.get('rating') || '');
    const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [slug, searchParams, currentPage, sortBy, priceRange, selectedRating, inStockOnly]);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data.categories);
        } catch (error) {
            console.error('Error fetching categories');
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let categoryId = '';
            if (slug && slug !== 'all') {
                const { data: catData } = await api.get(`/categories/slug/${slug}`);
                categoryId = catData.category._id;
            }

            const params = {
                page: currentPage,
                limit: 12,
                sort: sortBy,
                search: searchParams.get('q') || '',
                ...(categoryId && { category: categoryId }),
                ...(priceRange[0] > 0 && { minPrice: priceRange[0] }),
                ...(priceRange[1] < 2000 && { maxPrice: priceRange[1] }),
                ...(selectedRating && { rating: selectedRating }),
                ...(inStockOnly && { inStock: true })
            };

            const { data } = await api.get('/products', { params });
            setProducts(data.products);
            setTotalPages(data.totalPages);
            setTotalProducts(data.total);
        } catch (error) {
            console.error('Error fetching products:', error);
            // Don't toast on first load if category not found, just show empty
        } finally {
            setLoading(false);
        }
    };

    const currentCategory = categories.find(c => c.slug === slug);

    const getQuantityInCart = (productId) => {
        return cartItems.find(item => item._id === productId)?.quantity || 0;
    };

    return (
        <div className="min-h-screen bg-main-bg transition-colors">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumbs & Title */}
                <div className="mb-8">
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] mb-3">
                        <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
                        <ChevronRight size={10} strokeWidth={3} />
                        <span className="text-text-primary capitalize">{currentCategory?.name || 'Search Results'}</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                                {currentCategory?.name || `Results for "${searchParams.get('q') || ''}"`}
                            </h1>
                            <p className="text-sm text-text-secondary mt-1">{totalProducts} products found</p>
                        </div>

                        {/* Desktop Sort */}
                        <div className="hidden md:flex items-center space-x-3">
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Sort by:</span>
                            <div className="relative group">
                                <button className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 flex items-center space-x-2 text-sm font-bold text-text-primary hover:border-brand-primary transition-all shadow-sm">
                                    <span>{sortBy === 'relevance' ? 'Relevance' : sortBy.replace('_', ' ')}</span>
                                    <ChevronDown size={14} />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 overflow-hidden">
                                    {['relevance', 'price_asc', 'price_desc', 'rating', 'newest'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setSortBy(opt)}
                                            className="w-full text-left px-4 py-3.5 text-sm font-bold text-text-secondary hover:bg-brand-bg-light hover:text-brand-primary transition-colors"
                                        >
                                            {opt === 'relevance' ? 'Relevance' : opt.replace('_', ' ').charAt(0).toUpperCase() + opt.replace('_', ' ').slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Filter & Sort Sticky Bar */}
                <div className="md:hidden sticky top-[60px] md:top-[80px] z-40 bg-light-bg/80 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 flex space-x-3 overflow-x-auto no-scrollbar border-b border-gray-100">
                    <button
                        onClick={() => setShowFiltersMobile(true)}
                        className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-bold text-gray-700 shadow-sm whitespace-nowrap tap-target"
                    >
                        <Filter size={16} />
                        <span>Filters</span>
                        {(priceRange[0] > 0 || priceRange[1] < 2000 || selectedRating || inStockOnly) && (
                            <div className="w-2 h-2 bg-brand-primary rounded-full ml-1" />
                        )}
                    </button>
                    
                    <div className="relative group flex-shrink-0 flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-bold text-gray-700 shadow-sm tap-target">
                         <span className="mr-1 text-gray-400">Sort:</span>
                         <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border-none appearance-none focus:ring-0 pr-6 text-brand-primary font-bold w-full h-full absolute inset-0 opacity-0 cursor-pointer"
                         >
                            <option value="relevance">Relevance</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="rating">Top Rated</option>
                            <option value="newest">Newest Arrivals</option>
                         </select>
                         <span className="text-brand-primary capitalize">{sortBy === 'relevance' ? 'Relevance' : sortBy.replace('_', ' ')}</span>
                         <ChevronDown size={14} className="ml-1 text-gray-400" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar / Filters (Desktop) */}
                    <aside className="hidden md:block w-64 shrink-0 space-y-8">
                        {/* Price Range */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Price Range</h4>
                            <div className="space-y-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="2000"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                />
                                <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                                    <span>₹{priceRange[0]}</span>
                                    <span>₹{priceRange[1]}</span>
                                </div>
                            </div>
                        </div>

                        {/* Ratings */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer Rating</h4>
                            <div className="space-y-2">
                                {[4, 3, 2, 1].map((star) => (
                                    <label key={star} className="flex items-center space-x-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="rating"
                                            onChange={() => setSelectedRating(star)}
                                            className="w-4 h-4 text-brand-primary focus:ring-brand-primary border-gray-300"
                                        />
                                        <div className="flex items-center text-sm font-medium text-gray-600 group-hover:text-brand-primary transition-colors">
                                            {star}+ <Star size={14} className="fill-yellow-400 text-yellow-400 ml-1 mr-2" /> & above
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* In Stock */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-md border border-gray-100 ">
                            <span className="text-sm font-bold text-gray-700 ">In Stock Only</span>
                            <button
                                onClick={() => setInStockOnly(!inStockOnly)}
                                className={`w-10 h-5 rounded-full transition-all relative ${inStockOnly ? 'bg-brand-primary' : 'bg-gray-200 '}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${inStockOnly ? 'left-5.5 shadow-md' : 'left-0.5 shadow-sm'}`} />
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setPriceRange([0, 2000]);
                                setSelectedRating(null);
                                setInStockOnly(false);
                            }}
                            className="w-full py-3.5 text-[10px] font-black text-brand-primary border border-brand-primary/20 bg-brand-primary/5 rounded-xl hover:bg-brand-primary hover:text-white transition-all uppercase tracking-[0.1em] tap-target"
                        >
                            Reset Filters
                        </button>
                    </aside>

                    {/* Mobile Filters Bottom Sheet */}
                    <BottomSheet 
                        isOpen={showFiltersMobile} 
                        onClose={() => setShowFiltersMobile(false)}
                        title="Filters"
                    >
                        <div className="space-y-8 pb-8">
                            {/* Price Range */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Price Range</h4>
                                <div className="space-y-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="2000"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                    />
                                    <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                                        <span>₹{priceRange[0]}</span>
                                        <span>₹{priceRange[1]}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Ratings */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer Rating</h4>
                                <div className="space-y-4">
                                    {[4, 3, 2, 1].map((star) => (
                                        <label key={star} className="flex items-center space-x-3 cursor-pointer group p-2 -m-2 rounded-md active:bg-gray-50 tap-target">
                                            <input
                                                type="radio"
                                                name="rating-mobile"
                                                checked={selectedRating === star}
                                                onChange={() => setSelectedRating(star)}
                                                className="w-5 h-5 text-brand-primary focus:ring-brand-primary border-gray-300"
                                            />
                                            <div className="flex items-center text-base font-medium text-gray-600 transition-colors">
                                                {star}+ <Star size={16} className="fill-yellow-400 text-yellow-400 ml-1 mr-2" /> & above
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* In Stock */}
                            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 tap-target transition-colors" onClick={() => setInStockOnly(!inStockOnly)}>
                                <span className="text-base font-bold text-gray-700">In Stock Only</span>
                                <div
                                    className={`w-12 h-6 rounded-full transition-all relative ${inStockOnly ? 'bg-brand-primary' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${inStockOnly ? 'left-6.5 shadow-md' : 'left-0.5 shadow-sm'}`} />
                                </div>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    onClick={() => {
                                        setPriceRange([0, 2000]);
                                        setSelectedRating(null);
                                        setInStockOnly(false);
                                    }}
                                    className="flex-1 py-4 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest tap-target"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowFiltersMobile(false)}
                                    className="flex-1 py-4 text-sm font-bold text-white bg-brand-primary rounded-xl hover:bg-brand-secondary transition-all uppercase tracking-widest shadow-lg shadow-brand-primary/20 tap-target"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </BottomSheet>

                    {/* Product Grid Area */}
                    <div className="flex-1 mb-20 md:mb-0">
                        {loading ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white rounded-md p-4 space-y-4">
                                        <div className="aspect-square bg-gray-100 animate-pulse rounded-md" />
                                        <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                                        <div className="h-4 bg-gray-100 animate-pulse rounded w-1/2" />
                                        <div className="h-10 bg-gray-100 animate-pulse rounded w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-64 h-64 mb-8 bg-brand-primary/5 rounded-full flex items-center justify-center">
                                    <Search size={80} className="text-brand-primary opacity-20" />
                                </div>
                                <h3 className="text-2xl font-heading font-extrabold text-gray-800 mb-2">No results found</h3>
                                <p className="text-text-muted mb-8">We couldn't find what you're looking for. Try adjusting your filters.</p>
                                <button
                                    onClick={() => setSearchParams({})}
                                    className="btn-primary"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                    {products.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex justify-center items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-md border border-gray-100 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-10 h-10 rounded-md font-bold text-sm transition-all ${currentPage === i + 1
                                                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-md border border-gray-100 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductListingPage;
