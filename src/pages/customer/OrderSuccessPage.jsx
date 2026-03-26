import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, Truck, ArrowRight, Share2, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import Navbar from '../../components/shared/Navbar';

const OrderSuccessPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        // Redirection countdown
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        const redirect = setTimeout(() => {
            navigate('/orders');
        }, 3000);
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
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => {
            clearInterval(timer);
            clearTimeout(redirect);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="min-h-screen bg-light-bg">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-20 text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-8"
                >
                    <CheckCircle2 size={48} />
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-gray-800 mb-4 uppercase tracking-tight">
                        Thank you for the order!
                    </h1>
                    <p className="text-xl text-text-muted mb-6">
                        Order <span className="text-brand-primary font-bold">#{orderId?.slice(-6).toUpperCase()}</span> is successfully placed.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-green-600 font-bold mb-12 bg-green-50 w-fit mx-auto px-6 py-2 rounded-full border border-green-100">
                        <Truck size={20} />
                        <span>Arriving in 10-15 minutes</span>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-gray-400 font-bold mb-12">
                        <Clock size={16} />
                        <span>Redirecting to my orders in {countdown}s...</span>
                    </div>

                    <div className="bg-white rounded-md p-8 shadow-card border border-gray-100 mb-12 text-left">
                        <h4 className="font-heading font-extrabold text-gray-800 mb-6 uppercase text-sm tracking-widest border-b border-gray-50 pb-4">Next Steps</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Seller confirmation</p>
                                    <p className="text-xs text-text-muted">Seller is packing your fresh items</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4 opacity-50">
                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Delivery Assignment</p>
                                    <p className="text-xs text-text-muted">Assigning nearest partner</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4 opacity-50">
                                <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Delivered</p>
                                    <p className="text-xs text-text-muted">Enjoy your meal!</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to={`/track/${orderId}`} className="w-full sm:w-auto btn-primary !py-4 px-10 flex items-center justify-center space-x-3 group">
                            <span className="text-lg">Track Live Order</span>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/" className="w-full sm:w-auto px-10 py-4 font-bold text-gray-600 hover:text-brand-primary transition-colors border border-gray-100 rounded-md bg-white hover:shadow-md">
                            Continue Shopping
                        </Link>
                    </div>

                    <button className="mt-12 flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-brand-primary transition-colors mx-auto">
                        <Share2 size={16} />
                        <span>Share with friends</span>
                    </button>
                </motion.div>
            </main>
        </div>
    );
};

export default OrderSuccessPage;
