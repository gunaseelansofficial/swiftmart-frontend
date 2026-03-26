import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { ShoppingCart, User, Search, MapPin, ChevronDown, LogOut, Package, Heart, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { setLocation, setLocationLoading, setLocationError } from '../../store/slices/locationSlice';
import axios from 'axios';
import { getImageUrl } from '../../utils/imageHelper';
import NotificationPopover from './NotificationPopover';
import LocationPickerModal from './LocationPickerModal';
import LocationPopover from './LocationPopover';
import useLocation from '../../hooks/useLocation';

const Navbar = () => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { totalQuantity } = useSelector((state) => state.cart);
    const { selectedLocation, loading: locationLoading } = useSelector((state) => state.location);
    const { unreadCount, notifications } = useSelector((state) => state.notifications);
    const { lat, lng, label, source, loading: hookLoading, error: hookError, detectLocation } = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLocationPopover, setShowLocationPopover] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const locationRef = useRef(null);
    const searchRef = useRef(null);

    const lastGeocodeRef = useRef(0);

    // Auto-sync hook results to Redux if no manual location is set
    useEffect(() => {
        if (!selectedLocation && label && lat && lng) {
            dispatch(setLocation({
                label,
                lat,
                lng,
                source,
                isApproximate: source === 'ip'
            }));
        }
    }, [label, lat, lng, source, selectedLocation]);

    const handleLocationPickerConfirm = (details) => {
        dispatch(setLocation(details));
        setShowLocationPicker(false);
        toast.success('Location updated!');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchQuery.length > 2) {
                try {
                    const { data } = await api.get(`/products/autocomplete?query=${searchQuery}`);
                    setSearchResults(data.products);
                    setShowResults(true);
                } catch (error) {
                    console.error('Autocomplete failed');
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowResults(false);
        }
    };

    return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-dark-bg border-b border-gray-100 dark:border-white/5 shadow-sm transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    <div className="flex items-center h-full">
                        <Link to="/" className="flex flex-col">
                            <span className="text-xl md:text-2xl font-heading font-extrabold text-brand-primary tracking-tight leading-none">SWIFTMART</span>
                            <span className="text-[8px] md:text-[10px] font-bold text-text-secondary tracking-widest hidden md:inline py-1">10 MIN DELIVERY</span>
                        </Link>
                    </div>

                    <div className="hidden md:block relative" ref={locationRef}>
                         <button
                             onClick={() => setShowLocationPopover(true)}
                             className="flex items-center space-x-2 bg-white dark:bg-white/5 px-4 py-2.5 rounded-full cursor-pointer hover:bg-brand-bg-light/50 dark:hover:bg-brand-primary/10 transition-all border border-gray-100 dark:border-white/10 ml-8 max-w-[200px]"
                         >
                            <MapPin size={18} className="text-brand-primary flex-shrink-0" />
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="text-[10px] font-bold text-text-secondary uppercase leading-none">Delivering to</span>
                                <span className="text-sm font-bold text-text-primary truncate w-full">
                                    {locationLoading ? 'Locating...' : (selectedLocation?.label || 'Select Location')}
                                </span>
                            </div>
                            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                        </button>

                        <LocationPopover 
                            isOpen={showLocationPopover}
                            onClose={() => setShowLocationPopover(false)}
                            onOpenMap={() => {
                                setShowLocationPopover(false);
                                setShowLocationPicker(true);
                            }}
                            currentAddress={selectedLocation?.label}
                        />

                        <LocationPickerModal 
                            isOpen={showLocationPicker}
                            onClose={() => setShowLocationPicker(false)}
                            onConfirm={handleLocationPickerConfirm}
                            initialLocation={selectedLocation?.lat ? [selectedLocation.lat, selectedLocation.lng] : null}
                        />
                    </div>

                    <div className="flex-1 max-w-lg mx-8 hidden lg:block relative" ref={searchRef}>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search for 'milk', 'eggs' or 'bread'..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-full py-3.5 pl-12 pr-4 focus:bg-white dark:focus:bg-navy-dark focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary focus:outline-none transition-all text-text-primary dark:text-white placeholder:text-text-secondary/60"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary dark:text-gray-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                        </div>

                        {/* Autocomplete Dropdown */}
                        <AnimatePresence>
                            {showResults && searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-navy-light rounded-md shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
                                >
                                    {searchResults.map((p) => (
                                        <Link
                                            key={p._id}
                                            to={`/product/${p._id}`}
                                            onClick={() => setShowResults(false)}
                                            className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-none"
                                        >
                                            <img 
                                                src={getImageUrl(p.images?.[0] || p.image)} 
                                                alt={p.name} 
                                                className="w-10 h-10 rounded object-cover" 
                                                onError={(e) => e.target.src = '/placeholder-product.png'}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-800 dark:text-white">{p.name}</p>
                                                <p className="text-xs font-bold text-brand-primary">₹{p.price}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 md:space-x-6">
                        {/* Mobile Actions Overlay: Just search icon and cart */}
                        <button 
                            className="md:hidden text-gray-400 tap-target flex items-center justify-center p-2 hover:text-brand-primary transition-colors"
                            onClick={() => {
                                // On Mobile, scroll to top search bar or focus it on home page 
                                window.scrollTo({top: 0, behavior: 'smooth'}); 
                            }}
                        >
                            <Search size={22} />
                        </button>

                        <div className="md:hidden">
                            {isAuthenticated && <NotificationPopover color="text-gray-400" />}
                        </div>

                        {!isAuthenticated ? (
                            <div className="hidden md:flex items-center">
                                <Link to="/login" className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-brand-primary">
                                    Login
                                </Link>
                            </div>
                        ) : (
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center space-x-2 focus:outline-none"
                                >
                                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                                        {user?.name?.charAt(0)}
                                    </div>
                                    <span className="hidden md:block text-sm font-bold text-gray-700 dark:text-gray-200">{user?.name}</span>
                                </button>

                                <AnimatePresence>
                                    {showProfileMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                                        >
                                            <Link to="/orders" className="flex items-center space-x-3 px-4 py-3 hover:bg-brand-bg-light/30 text-sm font-medium text-text-primary">
                                                <Package size={18} />
                                                <span>My Orders</span>
                                            </Link>
                                            <Link to="/profile" className="flex items-center space-x-3 px-4 py-3 hover:bg-brand-bg-light/30 text-sm font-medium text-text-primary">
                                                <User size={18} />
                                                <span>My Profile</span>
                                            </Link>
                                            {user?.role === 'admin' && (
                                                <Link to="/admin" className="flex items-center space-x-3 px-4 py-3 hover:bg-brand-bg-light/30 text-sm font-medium text-text-primary">
                                                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                                    <span>Admin Dashboard</span>
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => dispatch(logout())}
                                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-sm font-medium text-red-600 border-t border-gray-50"
                                            >
                                                <LogOut size={18} />
                                                <span>Logout</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Notifications */}
                        <div className="hidden md:block">
                            {isAuthenticated && <NotificationPopover />}
                        </div>

                        <Link to="/wishlist" className="relative group p-2 text-gray-400 hover:text-red-500 transition-colors hidden md:block">
                            <Heart size={24} className={user?.wishlist?.length > 0 ? "fill-red-500 text-red-500" : ""} />
                            {user?.wishlist?.length > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-dark-bg shadow-sm">
                                    {user.wishlist.length}
                                </span>
                            )}
                        </Link>

                        {/* Desktop Only Cart Button Text */}
                        <Link 
                            to="/cart" 
                            className="flex items-center space-x-2 relative tap-target md:bg-brand-primary md:text-white text-gray-400 md:py-2.5 md:px-6 rounded-xl flex-shrink-0 transition-all hover:text-brand-primary md:hover:bg-brand-primary/90 md:hover:scale-[1.02] md:shadow-sm"
                        >
                            <ShoppingCart size={22} className="md:w-5 md:h-5" />
                            <span className="font-bold hidden md:inline">My Cart</span>
                            {totalQuantity > 0 && (
                                <span className="absolute md:-top-2 md:-right-2 -top-1 -right-1 bg-brand-primary text-white md:bg-white md:text-brand-primary text-[8px] md:text-[10px] sm:text-xs font-black w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white md:border-brand-primary">
                                    {totalQuantity}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Mobile Row 2: Location (More prominent but compact) */}
                <div className="md:hidden flex items-center pb-3 -mt-1 overflow-hidden">
                    <button 
                        className="flex items-center bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/5 w-full max-w-full"
                        onClick={() => setShowLocationPopover(true)}
                    >
                        <MapPin size={14} className="text-brand-primary mr-2 flex-shrink-0" />
                        <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest truncate flex-1 text-left">
                            {locationLoading ? 'Locating...' : (selectedLocation?.label || 'Select Location')}
                        </span>
                        <ChevronDown size={12} className="ml-2 text-gray-400 flex-shrink-0" />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
