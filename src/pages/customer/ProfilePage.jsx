import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    MapPin,
    Package,
    Plus,
    Trash2,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { setUser } from '../../store/slices/authSlice';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user: authUser } = useSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(true);
    const [user, setUserData] = useState(null);
    const [orders, setOrders] = useState([]);

    // Personal Info Form
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        avatar: ''
    });

    // Address Form
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'Home',
        street: '',
        city: '',
        pincode: '',
        lat: 12.9716,
        lng: 77.5946
    });

    useEffect(() => {
        fetchUserData();
        fetchMyOrders();
    }, []);

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                phone: user.phone || '',
                avatar: user.avatar || ''
            });
        }
    }, [user]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/auth/me');
            setUserData(data.user);
            dispatch(setUser(data.user));
        } catch (error) {
            toast.error('Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyOrders = async () => {
        try {
            const { data } = await api.get('/orders/my');
            setOrders(data.orders);
        } catch (error) {
            console.error('Failed to fetch orders');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put('/auth/profile', profileForm);
            setUserData(data.user);
            dispatch(setUser(data.user));
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/address', newAddress);
            setUserData(data.user);
            dispatch(setUser(data.user));
            toast.success('Address added');
            setShowAddressForm(false);
            setNewAddress({ label: 'Home', street: '', city: '', pincode: '', lat: 12.9716, lng: 77.5946 });
        } catch (error) {
            toast.error('Failed to add address');
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            const { data } = await api.delete(`/auth/address/${id}`);
            setUserData(data.user);
            dispatch(setUser(data.user));
            toast.success('Address deleted');
        } catch (error) {
            toast.error('Failed to delete address');
        }
    };

    const handleSetDefaultAddress = async (id) => {
        try {
            const { data } = await api.patch(`/auth/address/${id}/default`);
            setUserData(data.user);
            dispatch(setUser(data.user));
            toast.success('Default address updated');
        } catch (error) {
            toast.error('Failed to set default address');
        }
    };

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setNewAddress(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
            },
        });
        return <Marker position={[newAddress.lat, newAddress.lng]} />;
    };

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: <User size={18} /> },
        { id: 'addresses', label: 'Addresses', icon: <MapPin size={18} /> },
        { id: 'orders', label: 'Orders', icon: <Package size={18} /> },
    ];

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <div className="min-h-screen bg-light-bg pb-20 md:pb-0">
            <Navbar />
            <main className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4 md:py-12">
                {/* Mobile Back Button */}
                <div className="lg:hidden px-4 mb-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-800 shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* Sidebar Tabs */}
                    <aside className="w-full md:w-64 space-y-2 px-4 md:px-0">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-2xl border-2 border-white shadow-sm overflow-hidden">
                                    {user?.avatar ? <img src={user.avatar} alt="" /> : user?.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-heading font-extrabold text-[#1A1A2E] leading-tight truncate max-w-[120px]">{user?.name}</h3>
                                    <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mt-1">Customer</p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Scrollable Tabs */}
                        <div className="flex md:flex-col overflow-x-auto no-scrollbar gap-2 pb-2 md:pb-0 md:gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 flex items-center space-x-2 md:space-x-3 px-4 md:px-6 py-3 md:py-4 rounded-xl text-xs md:text-sm font-bold transition-all tap-target ${activeTab === tab.id
                                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                        : 'text-gray-500 hover:bg-white hover:text-brand-primary'
                                    }`}
                                >
                                    {tab.icon}
                                    <span className="whitespace-nowrap">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 w-full overflow-hidden">
                        <AnimatePresence mode="wait">
                            {activeTab === 'personal' && (
                                <motion.div
                                    key="personal"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white md:rounded-3xl p-6 md:p-8 md:shadow-xl md:border md:border-gray-100 min-h-[50vh]"
                                >
                                    <h3 className="text-2xl font-heading font-extrabold text-[#1A1A2E] mb-8 uppercase italic tracking-tighter">Personal Information</h3>
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={profileForm.name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={profileForm.phone}
                                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-full">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address (Read-only)</label>
                                                <input
                                                    type="email"
                                                    value={user?.email}
                                                    disabled
                                                    className="w-full bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed font-bold"
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" className="btn-primary w-full md:w-auto px-12 py-4">Save Changes</button>
                                    </form>
                                </motion.div>
                            )}

                            {activeTab === 'addresses' && (
                                <motion.div
                                    key="addresses"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4 md:space-y-6 px-4 md:px-0"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-2xl font-heading font-extrabold text-[#1A1A2E] uppercase italic tracking-tighter">My Addresses</h3>
                                        {!showAddressForm && (
                                            <button
                                                onClick={() => setShowAddressForm(true)}
                                                className="flex items-center space-x-2 text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline"
                                            >
                                                <Plus size={16} />
                                                <span>Add New</span>
                                            </button>
                                        )}
                                    </div>

                                    {showAddressForm && (
                                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-brand-primary/20 relative">
                                            <h4 className="text-lg font-bold text-gray-800 mb-6">Add New Address</h4>
                                            <form onSubmit={handleAddAddress} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Label</label>
                                                        <select
                                                            value={newAddress.label}
                                                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 font-bold"
                                                        >
                                                            <option>Home</option>
                                                            <option>Work</option>
                                                            <option>Other</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Pincode</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.pincode}
                                                            onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 font-bold"
                                                        />
                                                    </div>
                                                    <div className="col-span-full space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Street Address</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress.street}
                                                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 font-bold"
                                                        />
                                                    </div>
                                                    <div className="col-span-full h-48 rounded-xl overflow-hidden border border-gray-100">
                                                        <MapContainer center={[newAddress.lat, newAddress.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                            <LocationMarker />
                                                        </MapContainer>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-4">
                                                    <button type="submit" className="btn-primary flex-1">Save Address</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddressForm(false)}
                                                        className="flex-1 bg-gray-100 text-gray-500 font-bold rounded-xl py-3 hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-6">
                                        {user?.addresses?.length > 0 ? (
                                            user.addresses.map((addr) => (
                                                <div key={addr._id} className={`bg-white p-5 md:p-6 rounded-2xl border ${addr.isDefault ? 'border-brand-primary ring-2 ring-brand-primary/10' : 'border-gray-100'} shadow-sm relative group`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                                                                <MapPin size={16} />
                                                            </div>
                                                            <span className="font-bold text-gray-800">{addr.label}</span>
                                                            {addr.isDefault && (
                                                                <span className="bg-brand-primary text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Default</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleDeleteAddress(addr._id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-500 font-medium mb-4 line-clamp-2">
                                                        {addr.street}, {addr.city} - {addr.pincode}
                                                    </p>
                                                    {!addr.isDefault && (
                                                        <button
                                                            onClick={() => handleSetDefaultAddress(addr._id)}
                                                            className="text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline"
                                                        >
                                                            Set as Default
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : !showAddressForm && (
                                            <div className="col-span-full py-12 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                                                <MapPin size={48} className="text-gray-200 mb-4" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No addresses saved</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'orders' && (
                                <motion.div
                                    key="orders"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4 md:space-y-6 px-4 md:px-0"
                                >
                                    <h3 className="text-2xl font-heading font-extrabold text-[#1A1A2E] uppercase italic tracking-tighter">Recent Orders</h3>
                                    <div className="space-y-3 md:space-y-4 pb-6">
                                        {orders.length > 0 ? (
                                            orders.slice(0, 5).map((order) => (
                                                <div key={order._id} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all cursor-pointer group tap-target" onClick={() => navigate(`/track/${order._id}`)}>
                                                    <div className="flex items-center space-x-4 md:space-x-6">
                                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                                            <img
                                                                src={order.items?.[0]?.product?.images?.[0] || 'https://via.placeholder.com/100'}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                                alt=""
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order #{order._id.slice(-6)}</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                                    }`}>
                                                                    {order.status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-gray-800">{order.items?.[0]?.product?.name} {order.items?.length > 1 && `+ ${order.items.length - 1} more`}</h4>
                                                            <p className="text-xs text-brand-primary font-bold mt-1">₹{order.totalAmount}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                                                <Package size={48} className="text-gray-200 mb-4" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No orders yet</p>
                                                <Link to="/category/all" className="mt-4 text-brand-primary font-bold uppercase text-xs hover:underline">Start Shopping</Link>
                                            </div>
                                        )}
                                        {orders.length > 5 && (
                                            <Link to="/orders" className="block text-center py-4 bg-white rounded-xl border border-gray-100 font-bold text-xs text-brand-primary uppercase tracking-widest hover:bg-gray-50 transition-all">
                                                View All Orders
                                            </Link>
                                        )}
                                    </div>
                                </motion.div>
                            )}


                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
