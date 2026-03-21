import { motion } from 'framer-motion';

const LoadingSpinner = ({ fullPage = false }) => {
    return (
        <div className={`${fullPage ? 'min-h-screen' : 'h-64'} flex flex-col items-center justify-center`}>
            <div className="relative">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center text-2xl"
                >
                    ⚡
                </motion.div>
            </div>
            <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                SwiftMart is loading...
            </p>
        </div>
    );
};

export default LoadingSpinner;
