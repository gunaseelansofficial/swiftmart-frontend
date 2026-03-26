import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Star, MessageSquare } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import api from '../../utils/api';
import { getImageUrl } from '../../utils/imageHelper';
import { motion } from 'framer-motion';

const ReviewsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [productRes, reviewsRes] = await Promise.all([
                api.get(`/products/${id}`),
                api.get(`/products/${id}/reviews`)
            ]);
            setProduct(productRes.data.product);
            setReviews(reviewsRes.data.reviews);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-dark-bg">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-8">
                    <div className="h-8 bg-gray-100 dark:bg-white/5 w-1/4 rounded" />
                    <div className="h-40 bg-gray-100 dark:bg-white/5 rounded" />
                    <div className="space-y-4">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-32 bg-gray-100 dark:bg-white/5 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors pb-10">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
                {/* Header with Back Button */}
                <div className="flex items-center space-x-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-gray-800 dark:text-white shadow-sm border border-gray-100 dark:border-white/10 hover:bg-brand-primary/10 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-gray-800 dark:text-white uppercase tracking-tight">Customer Reviews</h1>
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real feedback from verified buyers</p>
                    </div>
                </div>

                {/* Product Summary Card */}
                <Link to={`/product/${id}`} className="block bg-white dark:bg-white/5 rounded-[32px] p-6 mb-10 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-navy-dark p-3 overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                            <img
                                src={getImageUrl(product.images?.[0] || product.image)}
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                alt={product.name}
                                onError={(e) => e.target.src = '/placeholder-product.png'}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white truncate mb-2">{product.name}</h2>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center px-3 py-1 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg text-yellow-600 space-x-1.5">
                                    <Star size={14} className="fill-yellow-600" />
                                    <span className="text-sm font-black">{product.rating?.avg || 0}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{product.rating?.count || 0} Total Reviews</span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Reviews List */}
                <div className="space-y-6">
                    {reviews.length === 0 ? (
                        <div className="bg-white dark:bg-white/5 rounded-[32px] p-16 text-center border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageSquare size={32} className="text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No reviews yet</h3>
                            <p className="text-sm text-gray-400">Be the first to share your experience after purchasing this item!</p>
                        </div>
                    ) : (
                        reviews.map((rev, idx) => (
                            <motion.div
                                key={rev._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white dark:bg-white/5 rounded-[32px] p-8 border border-gray-100 dark:border-white/5 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black uppercase text-sm">
                                            {rev.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{rev.user?.name || 'Customer'}</p>
                                            <div className="flex items-center space-x-2 mt-0.5">
                                                <div className="flex items-center">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            size={10}
                                                            className={`${s <= rev.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-200 dark:text-white/10'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">Verified Buyer</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">"{rev.comment}"</p>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default ReviewsPage;
