import React from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-cream-white flex flex-col items-center justify-center p-6 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-md"
                    >
                        <div className="text-9xl mb-4">😰</div>
                        <h1 className="text-3xl font-heading font-extrabold text-navy-dark mb-4 uppercase">Something went wrong</h1>
                        <p className="text-gray-600 mb-8">We encountered an unexpected error. Don't worry, our team has been notified.</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="btn-primary px-8 py-3 rounded-full shadow-lg hover:shadow-brand-primary/20 transition-all font-bold uppercase tracking-widest"
                        >
                            Back to Safety
                        </button>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
