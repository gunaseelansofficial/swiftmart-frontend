import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    MapPin, Phone, Navigation, Clock, CheckCircle2, 
    ChevronLeft, ShoppingBag, Target, Maximize2, 
    Truck, User, Package, PartyPopper 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorBoundary from '../../components/shared/ErrorBoundary';

// Custom Marker Icons
const storeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/606/606132.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const partnerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2950/2950570.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const homeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1239/1239525.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const STORE_LOCATION = { lat: 12.9716, lng: 77.5946 };

const TrackOrderPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const { user } = useSelector((state) => state.auth);
    const socket = useSocket();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [partnerPos, setPartnerPos] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [showSuccess, setShowSuccess] = useState(routerLocation.state?.isNewOrder || false);

    const mapRef = useRef(null);
    const partnerMarkerRef = useRef(null);

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    useEffect(() => {
        if (!socket || !orderId) return;

        // Join room for this specific order
        socket.emit('join', `order_${orderId}`);
        console.log(`Joined room order_${orderId}`);

        socket.on('location:update', (data) => {
            if (data.orderId === orderId) {
                const newPos = [data.lat, data.lng];
                setPartnerPos(newPos);
                if (data.accuracy) setAccuracy(data.accuracy);

                // Smoothly move marker
                if (partnerMarkerRef.current) {
                    partnerMarkerRef.current.setLatLng(newPos);
                }

                // Auto-pan if off-screen
                if (mapRef.current) {
                    const map = mapRef.current;
                    if (!map.getBounds().contains(newPos)) {
                        map.panTo(newPos);
                    }
                }
            }
        });

        socket.on('order:status_update', (data) => {
            if (data.orderId === orderId) {
                setOrder(prev => ({ ...prev, status: data.status }));
                toast.success(`Order status: ${data.status.replace('_', ' ')}`);
            }
        });

        return () => {
            socket.off('location:update');
            socket.off('order:status_update');
        };
    }, [socket, orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/orders/${orderId}`);
            setOrder(data.order);
            if (data.order.deliveryPartner?.currentLocation) {
                setPartnerPos([
                    data.order.deliveryPartner.currentLocation.lat,
                    data.order.deliveryPartner.currentLocation.lng
                ]);
            }
        } catch (error) {
            toast.error('Failed to load tracking details');
        } finally {
            setLoading(false);
        }
    };

    const handleLocateMe = () => {
        if (mapRef.current && order?.deliveryAddress) {
            const { lat, lng } = order.deliveryAddress;
            mapRef.current.setView([lat, lng], 16);
        }
    };

    const handleFitBounds = () => {
        if (mapRef.current && order) {
            const points = [];
            points.push([STORE_LOCATION.lat, STORE_LOCATION.lng]);
            
            if (order.deliveryAddress?.lat && order.deliveryAddress?.lng) {
                points.push([order.deliveryAddress.lat, order.deliveryAddress.lng]);
            }
            
            if (partnerPos) points.push(partnerPos);
            
            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    };

    const statusSteps = [
        { id: 'placed', label: 'Placed', icon: <Package size={18} /> },
        { id: 'confirmed', label: 'Confirmed', icon: <CheckCircle2 size={18} /> },
        { id: 'packed', label: 'Packed', icon: <Package size={18} /> },
        { id: 'picked_up', label: 'Picked Up', icon: <Navigation size={18} /> },
        { id: 'on_the_way', label: 'On The Way', icon: <Truck size={18} /> },
        { id: 'delivered', label: 'Delivered', icon: <CheckCircle2 size={18} /> }
    ];

    const getCurrentStepIndex = () => {
        return statusSteps.findIndex(step => step.id === order?.status);
    };

    if (loading) return <LoadingSpinner fullPage />;
    if (!order) return <div className="h-screen flex items-center justify-center font-bold uppercase tracking-widest text-[#1A1A2E]">Order not found</div>;

    if (!order.deliveryPartner) return (
        <div className="min-h-screen bg-light-bg flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center bg-white p-12 rounded-2xl shadow-xl max-w-sm border border-gray-100"
            >
                <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
                    <Clock size={40} className="animate-pulse" />
                </div>
                <h3 className="text-xl font-heading font-extrabold text-[#1A1A2E] mb-2 uppercase italic tracking-tighter">Hang Tight!</h3>
                <p className="text-sm text-text-muted mb-8 leading-relaxed">We're currently assigning the best delivery partner for your fresh items. Tracking will be live in a moment!</p>
                <Link to="/orders" className="btn-primary w-full inline-block">Back to Orders</Link>
            </motion.div>
        </div>
    );

    return (
        <div className="relative h-screen w-full overflow-hidden">
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ y: -100, x: '-50%', opacity: 0 }}
                        animate={{ y: 24, x: '-50%', opacity: 1 }}
                        exit={{ y: -100, x: '-50%', opacity: 0 }}
                        className="absolute top-0 left-1/2 z-[2000] w-[90%] max-w-md"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl border border-green-100 p-4 flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-200">
                                <PartyPopper size={24} />
                            </div>
                            <div>
                                <h4 className="font-heading font-extrabold text-[#1A1A2E] leading-tight">🎉 Order Placed Successfully!</h4>
                                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">Live tracking is now active</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Link
                to="/orders"
                className="absolute top-6 left-6 z-[1000] bg-white p-3 rounded-full shadow-lg border border-gray-100 text-gray-700 hover:text-brand-primary transition-all"
            >
                <ChevronLeft size={24} />
            </Link>

            <ErrorBoundary>
                <div className="h-[65vh] md:h-full w-full relative">
                    <MapContainer
                        center={[STORE_LOCATION.lat, STORE_LOCATION.lng]}
                        zoom={13}
                        className="h-full w-full"
                        zoomControl={false}
                        whenCreated={(map) => { mapRef.current = map; }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        <Marker position={[STORE_LOCATION.lat, STORE_LOCATION.lng]} icon={storeIcon}>
                            <Popup>Store Location</Popup>
                        </Marker>

                        {order.deliveryAddress?.lat && order.deliveryAddress?.lng && (
                            <Marker position={[order.deliveryAddress.lat, order.deliveryAddress.lng]} icon={homeIcon}>
                                <Popup>Your Delivery Address</Popup>
                            </Marker>
                        )}

                        {partnerPos && (
                            <>
                                <Marker 
                                    position={partnerPos} 
                                    icon={partnerIcon}
                                    ref={partnerMarkerRef}
                                >
                                    <Popup>Delivery Partner is here</Popup>
                                </Marker>
                                {accuracy && (
                                    <Circle
                                        center={partnerPos}
                                        radius={accuracy}
                                        pathOptions={{ 
                                            color: '#22c55e', 
                                            fillColor: '#22c55e', 
                                            fillOpacity: 0.15,
                                            weight: 1
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </MapContainer>

                    <div className="absolute top-24 right-6 flex flex-col space-y-3 z-[1000]">
                        <button
                            onClick={handleLocateMe}
                            className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            title="Locate Delivery Address"
                        >
                            <Target size={20} />
                        </button>
                        <button
                            onClick={handleFitBounds}
                            className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            title="View Entire Route"
                        >
                            <Maximize2 size={20} />
                        </button>
                    </div>
                </div>
            </ErrorBoundary>

            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                className="absolute bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-dark-bg rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.1)] p-6 md:p-8 border-t border-gray-100 dark:border-white/5 h-[35vh] md:h-auto overflow-y-auto"
            >
                <div className="max-w-3xl mx-auto relative">
                    <div className="md:hidden absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
                    
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            <h2 className="text-2xl font-heading font-extrabold text-brand-primary uppercase italic">
                                {order.status.replace('_', ' ')}
                            </h2>
                        </div>
                        {order.otp && (order.status === 'picked_up' || order.status === 'on_the_way') && (
                            <div className="bg-brand-primary/10 border border-brand-primary/20 p-2 rounded-xl text-center">
                                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1 leading-tight">Delivery OTP</p>
                                <div className="flex space-x-1 justify-center">
                                    {order.otp.split('').map((digit, i) => (
                                        <span key={i} className="w-6 h-8 bg-white rounded-md flex items-center justify-center text-sm font-black text-brand-primary border border-brand-primary/10">
                                            {digit}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative flex justify-between items-center mb-8">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-primary -z-10 transition-all duration-500"
                            style={{ width: `${(getCurrentStepIndex() / (statusSteps.length - 1)) * 100}%` }}
                        />

                        {statusSteps.map((step, idx) => {
                            const isCompleted = idx <= getCurrentStepIndex();
                            const isActive = idx === getCurrentStepIndex();

                            return (
                                <div key={step.id} className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-white border-brand-primary text-brand-primary scale-110 shadow-lg' :
                                        isCompleted ? 'bg-brand-primary border-brand-primary text-white' :
                                            'bg-white border-gray-100 text-gray-300'
                                        }`}>
                                        <div className="scale-75">
                                            {step.icon}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {order.deliveryPartner && (
                        <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary overflow-hidden border-2 border-white shadow-sm shrink-0">
                                    {order.deliveryPartner.avatar ? <img src={order.deliveryPartner.avatar} alt="" className="w-full h-full object-cover" /> : <User size={24} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 uppercase tracking-tight">{order.deliveryPartner.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">SwiftMart Partner</p>
                                </div>
                            </div>
                            <a
                                href={`tel:${order.deliveryPartner.phone}`}
                                className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg"
                            >
                                <Phone size={18} />
                            </a>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default TrackOrderPage;
