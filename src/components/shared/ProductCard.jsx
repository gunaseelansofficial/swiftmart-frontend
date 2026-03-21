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
            className="bg-white rounded-md p-4 shadow-card border border-gray-100 group md:hover:shadow-hover transition-all relative min-w-[200px]"
        >
            {/* Discount Badge */}
            {product.discountPercent > 0 && (
                <div className="absolute top-4 left-4 z-10 bg-brand-primary text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                    {product.discountPercent}% OFF
                </div>
            )}

            {/* Wishlist Button */}
            <button
                onClick={handleToggleWishlist}
                className={`absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all shadow-sm ${isWishlisted ? 'text-red-500' : 'text-gray-400 md:hover:text-red-500 md:hover:scale-110 active:scale-95'}`}
            >
                <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
            </button>

            <Link to={`/product/${product._id}`} className="block mb-4 overflow-hidden rounded-md aspect-square bg-brand-primary/5 relative">
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category?.name}</p>
                <h3 className="font-bold text-gray-800 line-clamp-2 min-h-[3rem] md:group-hover:text-brand-primary transition-colors">
                    {product.name}
                </h3>
                <p className="text-xs text-text-muted font-medium">{product.weight} {product.unit}</p>
            </div>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-lg font-heading font-extrabold text-gray-800">₹{product.price}</span>
                    <span className="text-sm text-gray-400 line-through">₹{product.mrp}</span>
                </div>

                {quantity === 0 ? (
                    <button
                        onClick={handleAddToCart}
                        className="w-24 py-2 border border-brand-primary text-brand-primary rounded-md text-xs font-bold uppercase transition-all md:hover:bg-brand-primary md:hover:text-white active:bg-brand-primary active:text-white tap-target"
                    >
                        Add
                    </button>
                ) : (
                    <div className="flex items-center bg-brand-primary rounded-md p-1 min-w-[6rem] justify-between shadow-lg shadow-brand-primary/20 tap-target">
                        <button
                            onClick={handleRemoveFromCart}
                            className="w-7 h-7 flex items-center justify-center text-white md:hover:bg-white/10 active:bg-white/20 rounded transition-colors tap-target"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-white font-bold text-sm mx-2">{quantity}</span>
                        <button
                            onClick={handleAddToCart}
                            className="w-7 h-7 flex items-center justify-center text-white md:hover:bg-white/10 active:bg-white/20 rounded transition-colors tap-target"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProductCard;
