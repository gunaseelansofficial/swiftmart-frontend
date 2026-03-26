import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Navigation, Phone, MapPin } from 'lucide-react';

const AddressFormModal = ({ isOpen, onClose, address, setAddress, onSave, onOpenLocationPicker, loading }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl bg-white dark:bg-navy-dark rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-navy-dark">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-widest text-center">Enter Specific Delivery Details</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Help our partner find your door faster</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-none">
                            <div className="space-y-6">
                                {/* Location Summary (Non-editable or with change option) */}
                                <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl relative">
                                    <label className="text-[9px] font-black text-brand-primary uppercase tracking-widest block mb-1">Detected Area</label>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white pr-10">{address.street || 'No area selected'}</p>
                                    <button 
                                        onClick={onOpenLocationPicker}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-navy-light text-brand-primary rounded-xl shadow-md"
                                        title="Change Area"
                                    >
                                        <Navigation size={18} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">House / Flat No.</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 402, 4th Floor"
                                            value={address.houseNo}
                                            onChange={(e) => setAddress({ ...address, houseNo: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-white text-sm font-bold shadow-sm"
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Floor / Building (Opt)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Block A"
                                            value={address.floor}
                                            onChange={(e) => setAddress({ ...address, floor: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-white text-sm font-bold shadow-sm"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Landmark (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Near Apollo Hospital"
                                            value={address.landmark}
                                            onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-white text-sm font-bold shadow-sm"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Receiver's Mobile Number</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">+91</span>
                                            <input
                                                type="tel"
                                                placeholder="10-digit mobile number"
                                                value={address.phone}
                                                onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-white text-base font-black shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">City</label>
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={address.city}
                                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/10 border-0 rounded-xl py-3 px-4 text-xs font-bold text-gray-500"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Pincode</label>
                                        <input
                                            type="text"
                                            placeholder="Pincode"
                                            value={address.pincode}
                                            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/10 border-0 rounded-xl py-3 px-4 text-xs font-bold text-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        onClick={onSave}
                                        disabled={loading}
                                        className="w-full bg-brand-primary text-white font-black uppercase tracking-[0.2em] py-5 rounded-[24px] shadow-2xl shadow-brand-primary/30 flex items-center justify-center space-x-3 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                                            <>
                                                <CheckCircle2 size={24} />
                                                <span className="text-lg">Save & Deliver Here</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddressFormModal;
