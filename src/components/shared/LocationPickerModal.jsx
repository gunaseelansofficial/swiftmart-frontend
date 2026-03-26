import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, CheckCircle2, Search, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const LocationPickerModal = ({ isOpen, onClose, onConfirm, initialLocation }) => {
    const [position, setPosition] = useState(initialLocation || [12.9716, 77.5946]); // Bangalore default
    const [addressDetails, setAddressDetails] = useState({
        label: '',
        street: '',
        city: '',
        pincode: '',
        display_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const markerRef = useRef(null);

    // Update position when marker is dragged
    const LocationMarker = () => {
        const map = useMapEvents({
            dragend: () => {
                const marker = markerRef.current;
                if (marker) {
                    const newPos = marker.getLatLng();
                    setPosition([newPos.lat, newPos.lng]);
                    reverseGeocode(newPos.lat, newPos.lng);
                }
            },
            click: (e) => {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                reverseGeocode(lat, lng);
            }
        });

        return position ? (
            <Marker
                draggable={true}
                position={position}
                ref={markerRef}
                eventHandlers={{
                    dragend: (e) => {
                        const marker = e.target;
                        const newPos = marker.getLatLng();
                        setPosition([newPos.lat, newPos.lng]);
                        reverseGeocode(newPos.lat, newPos.lng);
                    },
                }}
            />
        ) : null;
    };

    const reverseGeocode = async (lat, lng) => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'Accept-Language': 'en' } }
            );
            
            const addr = data.address;
            setAddressDetails({
                label: addr.suburb || addr.neighbourhood || addr.city || addr.town || 'Selected Location',
                street: data.display_name.split(',').slice(0, 2).join(', '),
                city: addr.city || addr.town || addr.state_district || '',
                pincode: addr.postcode || '',
                display_name: data.display_name
            });
        } catch (error) {
            toast.error('Failed to get address details');
        } finally {
            setLoading(false);
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported');
            return;
        }

        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);
                reverseGeocode(latitude, longitude);
                setDetecting(false);
            },
            () => {
                toast.error('Location access denied');
                setDetecting(false);
            },
            { enableHighAccuracy: true }
        );
    };

    useEffect(() => {
        if (isOpen && !initialLocation) {
            handleDetectLocation();
        } else if (isOpen && initialLocation) {
            reverseGeocode(initialLocation[0], initialLocation[1]);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl bg-white dark:bg-navy-dark rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-widest">Select Delivery Location</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Move the pin to your exact delivery point</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row h-[600px]">
                            {/* Map Area */}
                            <div className="flex-1 relative h-[300px] lg:h-auto">
                                <MapContainer
                                    center={position}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <LocationMarker />
                                </MapContainer>

                                {/* Map Overlays */}
                                <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                                    <button
                                        onClick={handleDetectLocation}
                                        disabled={detecting}
                                        className="bg-white dark:bg-navy-light p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 text-brand-primary hover:scale-110 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {detecting ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Address Details Pane */}
                            <div className="w-full lg:w-96 bg-gray-50 dark:bg-[#0D1B2A] p-8 overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/5">
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center space-x-2 text-brand-primary mb-4 p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
                                            <MapPin size={20} />
                                            <span className="text-xs font-black uppercase tracking-widest">Confirm Location</span>
                                        </div>
                                        
                                        {loading ? (
                                            <div className="flex flex-col items-center py-12 text-gray-400">
                                                <Loader2 size={32} className="animate-spin mb-4" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Fetching Address...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Selected Area</label>
                                                    <p className="text-lg font-black text-gray-800 dark:text-white leading-tight">{addressDetails.label}</p>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Street Details</label>
                                                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 leading-snug">{addressDetails.street}</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">City</label>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{addressDetails.city}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Pincode</label>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{addressDetails.pincode}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-gray-200 dark:border-white/5">
                                        <button
                                            onClick={() => onConfirm({
                                                ...addressDetails,
                                                lat: position[0],
                                                lng: position[1]
                                            })}
                                            disabled={loading || !addressDetails.street}
                                            className="w-full py-5 bg-brand-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-brand-primary/30 flex items-center justify-center space-x-3 hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle2 size={18} />
                                            <span>Confirm & Use Location</span>
                                        </button>
                                        <p className="text-center text-[8px] text-gray-400 font-bold uppercase mt-4 tracking-widest">
                                            By confirming, you agree to our delivery terms
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LocationPickerModal;
