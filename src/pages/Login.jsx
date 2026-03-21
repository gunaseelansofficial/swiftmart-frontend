import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Login = () => {
    const location = useLocation();
    const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
    const [role, setRole] = useState('customer');

    useEffect(() => {
        setIsLogin(location.pathname !== '/register');
    }, [location.pathname]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state) => state.auth);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(loginStart());
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin 
                ? { email: formData.email, password: formData.password }
                : { ...formData, role };

            const { data } = await api.post(endpoint, payload);
            dispatch(loginSuccess(data));
            toast.success(isLogin ? 'Welcome back to SwiftMart!' : 'Account created successfully!');

            if (data.user.role === 'admin') navigate('/admin');
            else if (data.user.role === 'delivery_partner') navigate('/delivery');
            else navigate('/');
        } catch (error) {
            const message = error.response?.data?.message || 'Something went wrong';
            dispatch(loginFailure(message));
            toast.error(message);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-md w-full bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-10 relative overflow-hidden"
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl" />
                
                <div className="text-center mb-10">
                    <motion.div
                        key={isLogin ? 'login-header' : 'register-header'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-heading font-black text-gray-900 mb-3 tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-text-muted font-medium">
                            {isLogin 
                                ? 'SwiftMart: Freshness delivered in 10 minutes' 
                                : 'Join the community of fresh delivery lovers'}
                        </p>
                    </motion.div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-5"
                        >
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="input-field py-4 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input-field py-4 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all"
                                    placeholder="+91 00000 00000"
                                />
                            </div>
                        </motion.div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="input-field py-4 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all"
                            placeholder="your@email.com"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="input-field py-4 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center mt-4"
                    >
                        {loading ? (
                            <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-gray-500 font-medium">
                        {isLogin ? (
                            <>
                                New here? {' '}
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className="text-brand-primary font-black hover:underline underline-offset-4"
                                >
                                    Sign Up Free
                                </button>
                            </>
                        ) : (
                            <>
                                Already a member? {' '}
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className="text-brand-primary font-black hover:underline underline-offset-4"
                                >
                                    Log In
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
