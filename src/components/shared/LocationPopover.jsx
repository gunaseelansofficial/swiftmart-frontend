import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, X, Clock, Map as MapIcon, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setLocation } from '../../store/slices/locationSlice';
import toast from 'react-hot-toast';

const LocationPopover = ({ isOpen, onClose, onOpenMap, currentAddress }) => {
    const dispatch = useDispatch();
    const { selectedLocation } = useSelector(state => state.location);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentLocations, setRecentLocations] = useState([]);
    const popoverRef = useRef(null);

    useEffect(() => {
        const stored = localStorage.getItem('recent_locations');
        if (stored) setRecentLocations(JSON.parse(stored).slice(0, 3));
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`,
                { headers: { 'Accept-Language': 'en' } }
            );
            setResults(data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        const details = {
            label: item.address?.suburb || item.display_name.split(',')[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            source: 'manual'
        };

        dispatch(setLocation(details));
        saveRecent(details);
        onClose();
        toast.success('Location updated!');
    };

    const saveRecent = (loc) => {
        const updated = [loc, ...recentLocations.filter(r => r.lat !== loc.lat)].slice(0, 3);
        setRecentLocations(updated);
        localStorage.setItem('recent_locations', JSON.stringify(updated));
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const sheetVariants = {
        hidden: { y: '100%' },
        visible: { y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }
    };

    const dropdownVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Mobile Backdrop & Sheet */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-[2000] md:hidden"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={backdropVariants}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 z-[2001] md:hidden shadow-2xl max-h-[85vh] overflow-y-auto"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={sheetVariants}
                    >
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                        <LocationContent 
                            searchQuery={searchQuery}
                            handleSearch={handleSearch}
                            loading={loading}
                            results={results}
                            handleSelect={handleSelect}
                            recentLocations={recentLocations}
                            onOpenMap={onOpenMap}
                            selectedLocation={selectedLocation}
                        />
                    </motion.div>

                    {/* Desktop Dropdown */}
                    <motion.div
                        ref={popoverRef}
                        className="hidden md:block absolute top-full left-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[2001]"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={dropdownVariants}
                    >
                        <div className="p-6">
                            <LocationContent 
                                searchQuery={searchQuery}
                                handleSearch={handleSearch}
                                loading={loading}
                                results={results}
                                handleSelect={handleSelect}
                                recentLocations={recentLocations}
                                onOpenMap={onOpenMap}
                                selectedLocation={selectedLocation}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const LocationContent = ({ searchQuery, handleSearch, loading, results, handleSelect, recentLocations, onOpenMap, selectedLocation }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading font-extrabold text-[#1A1A2E] uppercase italic tracking-tighter">
                    Select Location
                </h3>
                {selectedLocation?.isApproximate && (
                    <span className="bg-orange-100 text-orange-700 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
                        Approximate
                    </span>
                )}
            </div>

            {/* Search Input */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                <input
                    type="text"
                    placeholder="Search for area, street name..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all text-sm"
                />
                {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Search Results */}
            {results.length > 0 ? (
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {results.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelect(item)}
                            className="w-full flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-all text-left group"
                        >
                            <MapPin className="text-gray-400 group-hover:text-brand-primary shrink-0 transition-colors" size={18} />
                            <div>
                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                    {item.display_name.split(',')[0]}
                                </p>
                                <p className="text-[10px] text-gray-400 line-clamp-1">{item.display_name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <>
                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-2">
                        <button 
                            onClick={() => onOpenMap()}
                            className="flex items-center justify-between p-4 bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/10 rounded-2xl transition-all group"
                        >
                            <div className="flex items-center space-x-3">
                                <Navigation className="text-brand-primary" size={20} />
                                <div className="text-left">
                                    <p className="text-sm font-black text-brand-primary uppercase italic">Confirm Precise Location</p>
                                    <p className="text-[10px] text-brand-primary/60 font-bold uppercase">Detect via GPS</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-brand-primary/40 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    {/* Recent Locations */}
                    {recentLocations.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                                <Clock size={12} className="mr-2" /> Recent Locations
                            </p>
                            <div className="space-y-1">
                                {recentLocations.map((loc, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect({ display_name: loc.address, lat: loc.lat, lon: loc.lng })}
                                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-all text-left"
                                    >
                                        <MapPin className="text-gray-300" size={16} />
                                        <span className="text-xs font-bold text-gray-600 truncate">{loc.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LocationPopover;
