import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    MapPin, Phone, Navigation, CheckCircle2, ChevronLeft,
    ShoppingBag, ArrowRight, MessageCircle, Copy, Check,
    User, Clock, ShieldCheck, AlertCircle, Loader2, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { calculateDistance } from '../../utils/geo';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const storeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/606/606132.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const homeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1239/1239525.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const partnerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2950/2950570.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const ActiveOrderPage = () => {
    const { user } = useSelector(state => state.auth);
    const [orders, setOrders] = useState([]);
    const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);
    const ordersRef = useRef([]); 
    const order = orders[selectedOrderIndex] || null;
    const [loading, setLoading] = useState(true);
    const [myPosition, setMyPosition] = useState(null);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [verifying, setVerifying] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [accuracy, setAccuracy] = useState(null);
    // Pickup OTP state (for the inline pickup verification flow)
    const [pickupOtp, setPickupOtp] = useState(['', '', '', '']);
    const [verifyingPickup, setVerifyingPickup] = useState(false);
    const pickupInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const socket = useSocket();
    const watchIdRef = useRef(null);
    const lastEmittedPosition = useRef(null);
    const lastEmitTime = useRef(0);
    const navigate = useNavigate();

    const storeLocation = [12.9716, 77.5946]; // Default store location

    useEffect(() => {
        fetchActiveOrder();

        if (socket) {
            setupSocketListeners();
        }

        return () => {
            stopTracking();
            if (socket) cleanupSocketListeners();
        };
    }, [socket]);

    useEffect(() => {
        ordersRef.current = orders;
        // Stop tracking if no order needs it
        const needsTracking = orders.some(o => o.status === 'picked_up' || o.status === 'on_the_way');
        if (!needsTracking) {
            stopTracking();
        }
    }, [orders]);

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    const cleanupSocketListeners = () => {
        if (!socket) return;
        socket.off('order:assigned');
        socket.off('order:status_changed');
    };

    const setupSocketListeners = () => {
        if (!socket) return;

        socket.on('order:assigned', () => {
            fetchActiveOrder();
            toast.success('New order assigned!');
        });

        socket.on('order:status_changed', ({ orderId, status }) => {
            setOrders(prev => prev.map(o => {
                if (o._id === orderId) {
                    return { ...o, status };
                }
                return o;
            }));
        });
    };

    const fetchActiveOrder = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/delivery/active-order');
            const activeOrders = data.orders || (data.order ? [data.order] : []);
            setOrders(activeOrders);
            if (activeOrders.some(o => o.status === 'picked_up' || o.status === 'on_the_way')) {
                startTracking();
            }
        } catch (error) {
            toast.error('Failed to fetch active order');
        } finally {
            setLoading(false);
        }
    };

    const startTracking = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported');
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy: newAccuracy } = position.coords;
                setAccuracy(newAccuracy);

                const now = Date.now();
                const distanceMoved = lastEmittedPosition.current
                    ? calculateDistance(lastEmittedPosition.current.lat, lastEmittedPosition.current.lng, latitude, longitude)
                    : Infinity;

                // Throttling: moved > 10m AND > 5s
                if (distanceMoved > 10 && (now - lastEmitTime.current) > 5000) {
                    if (socket) {
                        ordersRef.current.forEach(o => {
                            if (o.status === 'picked_up' || o.status === 'on_the_way') {
                                socket.emit('partner:location', {
                                    orderId: o._id,
                                    lat: latitude,
                                    lng: longitude,
                                    accuracy: newAccuracy
                                });
                            }
                        });
                    }
                    lastEmittedPosition.current = { lat: latitude, lng: longitude };
                    lastEmitTime.current = now;

                    // Update background location
                    api.patch('/delivery/location', { lat: latitude, lng: longitude }).catch(() => {});
                }
            },
            (err) => console.error('Tracking error:', err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            await api.patch(`/orders/${order._id}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: newStatus } : o));

            if (newStatus === 'picked_up') {
                toast.success('Order Picked Up! Head to delivery location.');
                startTracking();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    // Pickup OTP handlers (for store pickup verification)
    const handlePickupOtpChange = (index, value) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...pickupOtp];
        newOtp[index] = value;
        setPickupOtp(newOtp);
        if (value && index < 3) {
            pickupInputRefs[index + 1].current?.focus();
        }
    };

    const handlePickupOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pickupOtp[index] && index > 0) {
            pickupInputRefs[index - 1].current?.focus();
        }
    };

    const verifyPickupOtp = async () => {
        const otpValue = pickupOtp.join('');
        if (otpValue.length < 4) return toast.error('Enter all 4 digits');
        setVerifyingPickup(true);
        try {
            await api.post('/delivery/verify-pickup-otp', { orderId: order._id, otp: otpValue });
            toast.success('🛒 Order Picked Up! Head to the delivery location.');
            setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'picked_up' } : o));
            setPickupOtp(['', '', '', '']);
            startTracking();
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP verification failed');
        } finally {
            setVerifyingPickup(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto focus next
        if (value && index < 3) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const verifyDelivery = async () => {
        const otpValue = otp.join('');
        if (otpValue.length < 4) return toast.error('Enter full OTP');

        setVerifying(true);
        try {
            await api.post(`/delivery/order/${order._id}/verify-delivery`, { otp: otpValue });
            setIsSuccess(true);
            toast.success('Order Delivered Successfully!');
            setTimeout(() => {
                if (orders.length > 1) {
                    setIsSuccess(false);
                    setOtp(['', '', '', '']);
                    setShowOtpModal(false);
                    fetchActiveOrder();
                    setSelectedOrderIndex(0);
                } else {
                    navigate('/delivery/dashboard');
                }
            }, 3000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    if (!order) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#0D1B2A] text-white">
            <span className="text-6xl mb-4">📦</span>
            <h2 className="text-2xl font-bold mb-2">No Active Order</h2>
            <p className="text-gray-400 mb-6">You don't have any orders currently assigned.</p>
            <button
                onClick={() => navigate('/delivery/dashboard')}
                className="bg-brand-primary text-white px-8 py-3 rounded-full font-bold"
            >
                Go to Dashboard
            </button>
        </div>
    );

    const isPickedUp = order.status === 'picked_up' || order.status === 'on_the_way' || order.status === 'delivered';

    // Guard customer location — fall back to store if GPS coords missing
    const customerLat = order.deliveryAddress?.lat;
    const customerLng = order.deliveryAddress?.lng;
    const hasCustomerCoords = customerLat && customerLng;
    const customerLocation = hasCustomerCoords
        ? [customerLat, customerLng]
        : storeLocation;

    return (
        <div className="h-screen flex flex-col bg-[#0D1B2A] overflow-hidden relative">
            {/* Header */}
            <div className="bg-[#1B263B] p-4 flex items-center justify-between border-b border-gray-700 z-10">
                <button onClick={() => navigate('/delivery/dashboard')} className="p-2 text-gray-400 hover:text-white">
                    <ChevronLeft />
                </button>
                <div className="text-center">
                    <h1 className="text-xs font-black text-white uppercase tracking-widest leading-none">Order Details</h1>
                    <p className="text-brand-primary font-black text-[10px] uppercase leading-none mt-1 leading-tight">#{order.orderId.slice(-6)}</p>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Map Area */}
            <div className="flex-1 relative z-0">
                <MapContainer
                    center={myPosition || storeLocation}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={storeLocation} icon={storeIcon}><Popup>Store</Popup></Marker>
                    {hasCustomerCoords && (
                        <Marker position={customerLocation} icon={homeIcon}><Popup>Customer</Popup></Marker>
                    )}
                    {myPosition && <Marker position={myPosition} icon={partnerIcon}><Popup>You</Popup></Marker>}
                </MapContainer>

                {/* Distance Indicator Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
                    <div className="bg-[#1B263B]/90 backdrop-blur-md border border-gray-700 px-6 py-2 rounded-full shadow-2xl flex items-center space-x-3 pointer-events-auto">
                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Live Tracking Active</p>
                    </div>
                </div>
            </div>

            {/* Bottom Info Sheet */}
            <motion.div
                initial={{ y: "50%" }}
                animate={{ y: 0 }}
                className="bg-[#1B263B] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-gray-700 p-8 z-20"
            >
                {/* Active Orders Selector (only visible if > 1 order) */}
                {orders.length > 1 && (
                    <div className="flex overflow-x-auto gap-3 pb-4 mb-4 hide-scrollbar">
                        {orders.map((o, idx) => (
                            <button
                                key={o._id}
                                onClick={() => setSelectedOrderIndex(idx)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                    selectedOrderIndex === idx
                                        ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20'
                                        : 'bg-[#0D1B2A] text-gray-400 border-gray-700 hover:text-white'
                                }`}
                            >
                                Order #{o.orderId.slice(-6)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Customer Card */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                            {order.customer?.avatar ? (
                                <img src={order.customer.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                                <User size={28} />
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                            <h3 className="text-xl font-black text-white leading-tight">{order.customer?.name}</h3>
                            <p className="text-xs text-brand-primary font-bold">
                                {order.payment?.method?.toUpperCase()} • ₹{Math.round(order.totalAmount)}
                            </p>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <a href={`tel:${order.customer?.phone}`} className="w-12 h-12 rounded-2xl bg-[#0D1B2A] border border-gray-700 flex items-center justify-center text-brand-primary shadow-xl">
                            <Phone size={20} />
                        </a>
                        <button className="w-12 h-12 rounded-2xl bg-[#0D1B2A] border border-gray-700 flex items-center justify-center text-blue-400 shadow-xl">
                            <MessageCircle size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-[#0D1B2A] rounded-3xl p-6 border border-gray-700 mb-8">
                    <div className="flex items-start space-x-4">
                        <MapPin size={24} className="text-coral-accent shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Delivery Address</p>
                            <p className="text-sm font-bold text-white leading-snug">
                                {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Order Items ({order.items.length})</h4>
                        <div className="h-[1px] flex-1 bg-gray-800 mx-4"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="bg-gray-800/50 border border-gray-700 px-3 py-1.5 rounded-xl flex items-center space-x-2">
                                <span className="text-[10px] font-black text-brand-primary">{item.quantity}x</span>
                                <span className="text-[11px] font-bold text-gray-300">{item.product?.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                {order.status === 'assigned' ? (
                    /* Pickup OTP input — replaces Mark Picked Up button */
                    <div className="bg-[#0D1B2A] rounded-3xl p-6 border border-amber-500/40">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4 text-center">
                            🔐 Enter Pickup OTP from Store Staff
                        </p>
                        <div className="flex justify-center gap-3 mb-5">
                            {pickupOtp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={pickupInputRefs[idx]}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handlePickupOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handlePickupOtpKeyDown(idx, e)}
                                    className="w-14 h-16 bg-[#1B263B] border-2 border-gray-700 rounded-2xl text-2xl font-black text-white text-center focus:border-amber-400 focus:outline-none transition-colors"
                                />
                            ))}
                        </div>
                        <button
                            onClick={verifyPickupOtp}
                            disabled={verifyingPickup || pickupOtp.join('').length < 4}
                            className="w-full py-4 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                        >
                            {verifyingPickup ? 'Verifying...' : 'Verify Pickup OTP'}
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${isPickedUp ? `${customerLocation[0]},${customerLocation[1]}` : `${storeLocation[0]},${storeLocation[1]}`}`}
                            target="_blank"
                            className="flex-1 py-5 rounded-2xl bg-gray-800 text-gray-300 font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 border border-gray-700 active:scale-95 transition-all"
                        >
                            <Navigation size={18} />
                            <span>Map</span>
                        </a>

                        <button
                            onClick={() => setShowOtpModal(true)}
                            className="flex-[2] py-5 rounded-2xl bg-coral-accent text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-coral-accent/20 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                        >
                            <CheckCircle2 size={18} />
                            <span>Mark Delivered</span>
                        </button>
                    </div>
                )}
            </motion.div>

            {/* OTP Modal */}
            <AnimatePresence>
                {showOtpModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            onClick={() => !verifying && setShowOtpModal(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-[#1B263B] rounded-[40px] p-10 border border-gray-700 text-center"
                        >
                            {isSuccess ? (
                                <div className="py-8">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6 border border-green-500/30">
                                        <Check size={40} strokeWidth={3} />
                                    </div>
                                    <h2 className="text-3xl font-black text-white mb-2">Success!</h2>
                                    <p className="text-gray-400 font-bold mb-8 uppercase text-xs tracking-widest">Order Delivered</p>
                                    <div className="bg-[#0D1B2A] p-6 rounded-3xl border border-gray-700">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Commission Earned</p>
                                        <p className="text-3xl font-black text-brand-primary">₹{Math.round(order.totalAmount * 0.15)}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-8 font-black uppercase tracking-widest">Redirecting to home...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary mx-auto mb-6 border border-brand-primary/20">
                                        <ShoppingBag size={30} />
                                    </div>
                                    <h2 className="text-2xl font-black text-white leading-tight mb-2">Delivery Verification</h2>
                                    <p className="text-gray-400 text-sm font-bold mb-8">Ask the customer for the 4-digit OTP sent to their app.</p>

                                    <div className="flex justify-center gap-3 mb-10">
                                        {otp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                id={`otp-${idx}`}
                                                type="text"
                                                maxLength="1"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                className="w-14 h-18 bg-[#0D1B2A] border border-gray-700 rounded-2xl text-2xl font-black text-white text-center focus:border-brand-primary focus:outline-none transition-colors"
                                            />
                                        ))}
                                    </div>

                                    <button
                                        onClick={verifyDelivery}
                                        disabled={verifying}
                                        className="w-full py-5 rounded-2xl bg-brand-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-brand-primary/20 disabled:opacity-50"
                                    >
                                        {verifying ? 'Verifying...' : 'Verify & Complete'}
                                    </button>

                                    {!verifying && (
                                        <button
                                            onClick={() => setShowOtpModal(false)}
                                            className="mt-6 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                                        >
                                            Go Back
                                        </button>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActiveOrderPage;
