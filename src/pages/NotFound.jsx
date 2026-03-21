import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-cream-white flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg"
            >
                <div className="relative mb-12">
                    <span className="text-[180px] font-heading font-extrabold text-brand-primary/10 leading-none select-none">404</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="text-8xl"
                        >
                            🛵
                        </motion.div>
                    </div>
                </div>

                <h1 className="text-4xl font-heading font-extrabold text-navy-dark mb-4 uppercase tracking-tighter">Lost in Transit?</h1>
                <p className="text-gray-500 mb-10 text-lg">The page you're searching for seems to have been delivered to a different dimension.</p>

                <Link
                    to="/"
                    className="inline-flex items-center space-x-3 bg-navy-dark text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-primary transition-all shadow-xl shadow-navy-dark/10"
                >
                    <Home size={20} />
                    <span>Return To Home</span>
                </Link>
            </motion.div>
        </div>
    );
};

export default NotFound;
