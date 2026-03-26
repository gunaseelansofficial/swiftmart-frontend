import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StickyCartBar = () => {
    const { items, totalAmount, totalQuantity } = useSelector((state) => state.cart);
    const location = useLocation();

    // Hide if cart is empty OR user is already on the Cart/Checkout page
    const isHidden = 
        totalQuantity === 0 || 
        location.pathname === '/cart' || 
        location.pathname === '/checkout' ||
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/delivery');

    if (isHidden) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-[72px] md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-40"
            >
                <Link 
                    to="/cart"
                    className="flex items-center justify-between bg-brand-primary text-white p-4 rounded-2xl shadow-2xl shadow-brand-primary/30 group hover:scale-[1.02] transition-transform md:w-80"
                >
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <ShoppingBag size={20} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">
                                {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'} Added
                            </span>
                            <span className="text-lg font-bold leading-none">₹{totalAmount}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 font-bold">
                        <span className="text-sm">View Cart</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </motion.div>
        </AnimatePresence>
    );
};

export default StickyCartBar;
