import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import ProductCard from '../../components/shared/ProductCard';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const WishlistPage = () => {
    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        fetchWishlist();
    }, [user?.wishlist]); // Re-fetch if wishlist IDs change

    const fetchWishlist = async () => {
        try {
            const { data } = await api.get('/wishlist');
            setWishlistProducts(data.wishlist);
        } catch (error) {
            toast.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-light-bg pb-20 md:pb-0">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="flex items-center justify-between mb-8 md:mb-12">
                    <div>
                        <div className="flex items-center space-x-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
                            <span>/</span>
                            <span className="text-gray-600">Wishlist</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-heading font-extrabold text-[#1A1A2E] flex items-center">
                            Your Favorites <Heart className="ml-2 md:ml-3 fill-red-500 text-red-500 w-6 h-6 md:w-8 md:h-8" />
                        </h1>
                        <p className="text-xs md:text-sm text-text-muted mt-2">Saved items you might want to buy later</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-3 md:p-4 space-y-4 shadow-sm animate-pulse">
                                <div className="aspect-square bg-gray-100 rounded-xl" />
                                <div className="h-4 bg-gray-100 rounded w-3/4" />
                                <div className="h-10 bg-gray-100 rounded w-full" />
                            </div>
                        ))}
                    </div>
                ) : wishlistProducts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-2xl mx-auto"
                    >
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
                            <Heart size={48} />
                        </div>
                        <h2 className="text-3xl font-heading font-extrabold text-[#1A1A2E] mb-4 uppercase italic">Your wishlist is empty</h2>
                        <p className="text-text-muted mb-10 max-w-md mx-auto">Looks like you haven't added anything to your wishlist yet. Explore our products and save your favorites!</p>
                        <Link to="/category/all" className="btn-primary inline-flex items-center space-x-2 px-10">
                            <span>Start Shopping</span>
                            <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                        {wishlistProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default WishlistPage;
