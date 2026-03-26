import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, CheckCircle2, Search, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';


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
                        className="relative w-full max-w-xl bg-white dark:bg-navy-dark rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-navy-dark">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-widest">Confirm Location</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Verify your delivery address</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 bg-gray-50 dark:bg-[#0D1B2A]">
                            <div className="max-w-md mx-auto space-y-8">
                                <div className="flex items-center justify-between p-4 bg-white dark:bg-navy-light rounded-[24px] shadow-sm border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center space-x-3 text-brand-primary">
                                        <div className="p-3 bg-brand-primary/10 rounded-2xl">
                                            <Navigation size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Location</p>
                                            <p className="text-xs font-bold text-brand-primary uppercase">Auto-detect accurate location</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDetectLocation}
                                        disabled={detecting}
                                        className="bg-brand-primary text-white p-4 rounded-2xl shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {detecting ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} />}
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center space-x-2 text-brand-primary mb-4 p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
                                        <MapPin size={20} />
                                        <span className="text-xs font-black uppercase tracking-widest">Address Details</span>
                                    </div>
                                    
                                    {loading ? (
                                        <div className="flex flex-col items-center py-12 text-gray-400 bg-white dark:bg-navy-light rounded-[32px] border border-dashed border-gray-200 dark:border-white/10">
                                            <Loader2 size={32} className="animate-spin mb-4 text-brand-primary" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Fetching Address...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-5 bg-white dark:bg-navy-light p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-white/5">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Selected Area</label>
                                                <p className="text-lg font-black text-gray-800 dark:text-white leading-tight">{addressDetails.label || 'Not detected'}</p>
                                            </div>
                                            
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Street Details</label>
                                                <p className="text-sm font-bold text-gray-600 dark:text-gray-400 leading-snug">{addressDetails.street || '-'}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">City</label>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white">{addressDetails.city || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Pincode</label>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white">{addressDetails.pincode || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => onConfirm({
                                            ...addressDetails,
                                            lat: position[0],
                                            lng: position[1]
                                        })}
                                        disabled={loading || !addressDetails.street}
                                        className="w-full py-5 bg-brand-primary text-white font-black uppercase tracking-widest text-sm rounded-[24px] shadow-2xl shadow-brand-primary/30 flex items-center justify-center space-x-3 hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                                        <span>Confirm Delivery Location</span>
                                    </button>
                                    <p className="text-center text-[8px] text-gray-400 font-bold uppercase mt-6 tracking-[0.2em] opacity-50">
                                        SwiftMart Secure Delivery Service
                                    </p>
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
