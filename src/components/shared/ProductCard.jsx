import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';

import api from '../../utils/api';
import { toggleWishlist } from '../../store/slices/authSlice';
import { getImageUrl } from '../../utils/imageHelper';

const ProductCard = ({ product }) => {
    const dispatch = useDispatch();
    const cartItems = useSelector((state) => state.cart.items);

    // Check wishlist
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const isWishlisted = user?.wishlist?.includes(product._id);

    const quantity = cartItems.find(item => item._id === product._id)?.quantity || 0;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addToCart(product));
        toast.success('Added to cart');
    };

    const handleRemoveFromCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(removeFromCart(product._id));
    };

    const handleToggleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Please login to use wishlist');
            return;
        }

        const previousState = isWishlisted;

        // Optimistic Update
        dispatch(toggleWishlist(product._id));

        try {
            const { data } = await api.post(`/wishlist/${product._id}`);
            if (data.added) {
                toast.success('Added to wishlist ❤️');
            } else {
                toast.success('Removed from wishlist');
            }
        } catch (error) {
            // Revert on failure
            dispatch(toggleWishlist(product._id));
            toast.error('Failed to update wishlist');
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-white/5 rounded-[16px] p-4 shadow-sm border border-card-border dark:border-white/10 group hover:shadow-hover transition-all duration-300 relative"
        >
            {/* Discount Badge */}
            {product.discountPercent > 0 && (
                <div className="absolute top-3 left-3 z-10 bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {product.discountPercent}% OFF
                </div>
            )}

            {/* Wishlist Button */}
            <button
                onClick={handleToggleWishlist}
                className={`absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 dark:bg-navy-dark/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all shadow-sm ${isWishlisted ? 'text-red-500' : 'text-text-secondary dark:text-gray-400 hover:text-red-500 hover:scale-110 active:scale-95'}`}
            >
                <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
            </button>

            <Link to={`/product/${product._id}`} className="block mb-4 overflow-hidden rounded-[12px] aspect-square bg-gray-50 dark:bg-white/5 relative group">
                {/* Skeleton shimmer before load */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 via-brand-primary/10 to-brand-primary/5 animate-pulse -z-10" />
                <img
                    src={getImageUrl(product.images?.[0] || product.image)}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => e.target.src = '/placeholder-product.png'}
                />
            </Link>

            <div className="space-y-1 mb-4">
                <p className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-[0.1em]">{product.category?.name}</p>
                <h3 className="font-bold text-text-primary dark:text-white line-clamp-1 text-sm group-hover:text-brand-primary transition-colors">
                    {product.name}
                </h3>
                <p className="text-xs text-text-secondary dark:text-gray-400 font-medium tracking-tight mb-2">{product.weight} {product.unit}</p>
            </div>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-base font-bold text-text-primary dark:text-white">₹{product.price}</span>
                    <span className="text-[10px] text-text-secondary dark:text-gray-500 line-through">₹{product.mrp}</span>
                </div>

                {quantity === 0 ? (
                    <button
                        onClick={handleAddToCart}
                        className="w-20 py-2 bg-white dark:bg-transparent border border-brand-primary dark:border-white/20 text-brand-primary dark:text-white rounded-lg text-xs font-bold uppercase transition-all hover:bg-brand-primary hover:text-white dark:hover:bg-white dark:hover:text-navy-dark active:scale-95 shadow-sm"
                    >
                        Add
                    </button>
                ) : (
                    <div className="flex items-center bg-brand-primary rounded-lg p-1 min-w-[5.5rem] justify-between shadow-sm tap-target">
                        <button
                            onClick={handleRemoveFromCart}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 rounded transition-colors"
                        >
                            <Minus size={12} />
                        </button>
                        <span className="text-white font-bold text-xs mx-1">{quantity}</span>
                        <button
                            onClick={handleAddToCart}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 rounded transition-colors"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProductCard;
