import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, ArrowRight, Share2, ShoppingBag, MapPin, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import Navbar from '../../components/shared/Navbar';

const OrderSuccessPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        // Clear cart on mount
        dispatch(clearCart());
        // Trigger confetti celebration
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ 
                ...defaults, 
                particleCount: Math.floor(particleCount), 
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#3b82f6', '#1e3a8a', '#60a5fa'] // Brand blues
            });
            confetti({ 
                ...defaults, 
                particleCount: Math.floor(particleCount), 
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#3b82f6', '#1e3a8a', '#60a5fa']
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
                <div className="flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 260,
                            damping: 20 
                        }}
                        className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-brand-primary/40"
                    >
                        <CheckCircle size={40} strokeWidth={3} />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center mb-10"
                    >
                        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1A1A2E] mb-4 uppercase tracking-tighter italic">
                            Order Confirmed!
                        </h1>
                        <p className="text-lg text-gray-500 font-medium">
                            Sit back and relax while we bring the freshness to you.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="w-full bg-white rounded-[32px] p-8 md:p-12 shadow-2xl shadow-blue-900/5 border border-white relative overflow-hidden mb-12"
                    >
                        {/* Summary Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-100 mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Reference</p>
                                    <h4 className="font-heading font-extrabold text-gray-800 tracking-tight">#{orderId?.slice(-6).toUpperCase()}</h4>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estimated Delivery</p>
                                    <h4 className="font-heading font-extrabold text-[#1A1A2E] tracking-tight">10-15 Minutes</h4>
                                </div>
                            </div>
                        </div>

                        {/* Order Steps */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="relative">
                                <span className="absolute -left-2 top-0 text-[60px] font-black text-gray-50 pointer-events-none select-none">01</span>
                                <div className="relative z-10 flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/20">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Packing</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Success</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-2 top-0 text-[60px] font-black text-gray-50 pointer-events-none select-none">02</span>
                                <div className="relative z-10 flex items-start space-x-4 opacity-50">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">On the way</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Upcoming</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-2 top-0 text-[60px] font-black text-gray-50 pointer-events-none select-none">03</span>
                                <div className="relative z-10 flex items-start space-x-4 opacity-50">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Delivered</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Final Step</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
                    >
                        <button 
                            onClick={() => navigate(`/track/${orderId}`)} 
                            className="w-full sm:w-auto bg-brand-primary text-white font-black py-4 px-12 rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-brand-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-sm tracking-widest"
                        >
                            <span>Track Live Order</span>
                            <ArrowRight size={20} />
                        </button>
                        <Link 
                            to="/" 
                            className="w-full sm:w-auto py-4 px-12 font-black text-gray-500 hover:text-brand-primary transition-all border-2 border-gray-100 rounded-2xl bg-white hover:border-brand-primary/20 uppercase text-sm tracking-widest text-center"
                        >
                            Back to Home
                        </Link>
                    </motion.div>

                    <motion.button 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-12 flex items-center space-x-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-brand-primary transition-colors mx-auto group"
                    >
                        <Share2 size={14} className="group-hover:rotate-12 transition-transform" />
                        <span>Support: +91 900 000 0000</span>
                    </motion.button>
                </div>
            </main>
        </div>
    );
};

export default OrderSuccessPage;

