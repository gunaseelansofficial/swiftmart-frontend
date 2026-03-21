import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
    Calendar, Search, Filter, ChevronRight, 
    X, ShoppingBag, User as UserIcon, 
    CreditCard, IndianRupee, Clock,
    CheckCircle2, AlertCircle, Info,
    UserCircle, Phone, MapPin
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SettlementHistoryPage = () => {
    const [settlements, setSettlements] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [details, setDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchSettlements();
    }, [selectedDate]);

    const fetchSettlements = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/admin/daily-closing/history?date=${selectedDate}`);
            setSettlements(data);
        } catch (error) {
            toast.error('Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (settlementId) => {
        try {
            setDetailsLoading(true);
            const { data } = await api.get(`/admin/daily-closing/${settlementId}`);
            setDetails(data);
        } catch (error) {
            toast.error('Failed to fetch details');
        } finally {
            setDetailsLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            open: 'bg-blue-100 text-blue-700',
            submitted: 'bg-yellow-100 text-yellow-700',
            closed: 'bg-green-100 text-green-700',
            dispute: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
                {status}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-heading font-black text-gray-800 uppercase italic tracking-tighter">Settlement History</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Review past settlements and account closures</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center space-x-2 px-3 border-r border-gray-100">
                            <Calendar size={18} className="text-brand-primary" />
                            <span className="text-xs font-bold text-gray-500 uppercase">Select Date</span>
                        </div>
                        <input 
                            type="date" 
                            className="border-none focus:ring-0 text-sm font-black text-gray-800"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Partner</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Orders</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Cash Expected</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Cash Received</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Difference</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center">
                                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : settlements.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center">
                                            <div className="opacity-20 flex flex-col items-center">
                                                <Calendar size={48} />
                                                <p className="mt-4 text-sm font-bold uppercase tracking-widest">No settlements found for this date</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : settlements.map((s) => (
                                    <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-left">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold overflow-hidden">
                                                    {s.partnerId?.avatar ? (
                                                        <img src={s.partnerId.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : s.partnerId?.name?.[0] || 'P'}
                                                </div>
                                                <p className="text-sm font-bold text-gray-800">{s.partnerId?.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-gray-800">{s.totalOrders}</td>
                                        <td className="px-6 py-4 text-center font-black text-gray-800">₹{s.amountToSubmit}</td>
                                        <td className="px-6 py-4 text-center font-black text-gray-800">₹{s.amountSubmitted}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-sm font-black ${s.difference === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                ₹{s.difference}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={s.status} />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => {
                                                    setSelectedSettlement(s);
                                                    fetchDetails(s._id);
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-brand-primary transition-colors"
                                            >
                                                <Info size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Details Drawer */}
            <AnimatePresence>
                {selectedSettlement && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedSettlement(null)}
                            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-[100]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-full max-w-2xl bg-white shadow-2xl z-[101] overflow-y-auto"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 rounded-[24px] bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xl">
                                            {details?.settlement.partnerId?.avatar ? (
                                                <img src={details.settlement.partnerId.avatar} alt="" className="w-full h-full rounded-[24px] object-cover" />
                                            ) : details?.settlement.partnerId?.name?.[0] || 'P'}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3">
                                                <h2 className="text-2xl font-heading font-black text-gray-800 tracking-tighter uppercase italic">{details?.settlement.partnerId?.name}</h2>
                                                <StatusBadge status={details?.settlement.status} />
                                            </div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center mt-1">
                                                <Calendar size={14} className="mr-1.5" />
                                                {new Date(details?.settlement.settlementDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedSettlement(null)}
                                        className="p-3 bg-gray-50 text-gray-400 hover:text-gray-800 rounded-2xl transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cash Collected</p>
                                        <p className="text-xl font-black text-gray-800">₹{details?.settlement.cashCollected}</p>
                                    </div>
                                    <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">Commission</p>
                                        <p className="text-xl font-black text-brand-primary">₹{details?.settlement.commissionEarned}</p>
                                    </div>
                                    <div className="p-4 bg-gray-900 rounded-2xl">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Net Received</p>
                                        <p className="text-xl font-black text-white">₹{details?.settlement.amountSubmitted}</p>
                                    </div>
                                </div>

                                {/* Orders List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Included Orders ({details?.orders?.length || 0})</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {detailsLoading ? (
                                            <div className="py-10 text-center">
                                                <div className="w-6 h-6 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                            </div>
                                        ) : details?.orders?.map((order) => (
                                            <div key={order._id} className="p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-2 bg-gray-100 rounded-xl text-gray-500">
                                                        <ShoppingBag size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-800 uppercase">#{order.orderId.slice(-6)}</p>
                                                        <p className="text-[10px] font-bold text-gray-400">Customer: {order.customer?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-gray-800">₹{order.totalAmount}</p>
                                                    <div className="flex items-center justify-end space-x-2 mt-0.5">
                                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded">
                                                            COM: ₹{Math.round(order.totalAmount * 0.15)}
                                                        </span>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                                            order.payment.method === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {order.payment.method}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Admin Action / Notes */}
                                {(details?.settlement.adminNotes || details?.settlement.closedBy) && (
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                                        <div className="flex items-center space-x-2 text-gray-400">
                                            <UserCircle size={14} />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Closed by {details?.settlement.closedBy?.name || 'Admin'}</p>
                                        </div>
                                        {details?.settlement.adminNotes && (
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Admin Notes</p>
                                                <p className="text-sm font-medium text-gray-700 italic">"{details.settlement.adminNotes}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default SettlementHistoryPage;
