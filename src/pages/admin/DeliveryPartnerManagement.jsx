import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
    UserPlus, MoreVertical, Bike, Truck, Activity, 
    Wallet, TrendingUp, MapPin, ArrowUpRight, 
    ExternalLink, ShoppingBag, IndianRupee, 
    CreditCard, ClipboardCheck, Search, Info, 
    CheckCircle2, AlertCircle, Save, History 
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const DeliveryPartnerManagement = () => {
    const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' or 'closing'
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newPartner, setNewPartner] = useState({
        name: '', email: '', phone: '', password: 'Partner@' + Math.floor(Math.random() * 1000),
        vehicleType: 'Bike', vehicleNumber: '', licenseNumber: '',
        bankDetails: { accountNo: '', ifsc: '', holderName: '' }
    });

    // Closing States
    const [summary, setSummary] = useState(null);
    const [closingPartners, setClosingPartners] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [settlementData, setSettlementData] = useState({});

    useEffect(() => {
        if (activeTab === 'fleet') {
            fetchPartners();
        } else {
            fetchClosingData();
        }
    }, [activeTab]);

    const fetchPartners = async () => {
        try {
            const { data } = await api.get('/admin/delivery-partners');
            setPartners(data.partners);
        } catch (error) {
            toast.error('Failed to load partners');
        } finally {
            setLoading(false);
        }
    };

    const fetchClosingData = async () => {
        try {
            setLoading(true);
            const [summaryRes, partnersRes] = await Promise.all([
                api.get('/admin/daily-closing/today-summary'),
                api.get('/admin/daily-closing/today-partners')
            ]);
            setSummary(summaryRes.data);
            setClosingPartners(partnersRes.data);
            
            const initialSettlements = {};
            partnersRes.data.forEach(p => {
                if (p.settlement) {
                    initialSettlements[p.partner._id] = {
                        amountSubmitted: p.settlement.amountSubmitted || 0,
                        adminNotes: p.settlement.adminNotes || ''
                    };
                }
            });
            setSettlementData(initialSettlements);
        } catch (error) {
            toast.error('Failed to fetch closing data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (partnerId, field, value) => {
        setSettlementData(prev => ({
            ...prev,
            [partnerId]: { ...prev[partnerId], [field]: value }
        }));
    };

    const handleCloseAccount = async (partnerId) => {
        const data = settlementData[partnerId];
        if (!data || data.amountSubmitted === undefined) {
            return toast.error('Please enter amount received');
        }

        try {
            await api.post(`/admin/daily-closing/close/${partnerId}`, {
                amountSubmitted: Number(data.amountSubmitted),
                adminNotes: data.adminNotes || ''
            });
            toast.success('Account closed successfully!');
            fetchClosingData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to close account');
        }
    };

    const SummaryCard = ({ title, value, icon, subValue, subLabel }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-2xl font-heading font-extrabold text-gray-800 tracking-tighter">
                {typeof value === 'number' ? `₹${value.toLocaleString()}` : value}
            </h3>
            {subValue !== undefined && (
                <div className="mt-3 flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">{subValue} {subLabel}</span>
                </div>
            )}
        </div>
    );

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-heading font-extrabold text-gray-800 uppercase tracking-widest leading-none">Management</h1>
                    <p className="text-sm text-gray-500 mt-1 uppercase font-bold tracking-widest">Delivery Partner Ecosystem</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                        <button 
                            onClick={() => setActiveTab('fleet')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === 'fleet' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            Partner Fleet
                        </button>
                        <button 
                            onClick={() => setActiveTab('closing')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === 'closing' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            Daily Closing
                        </button>
                    </div>
                    {activeTab === 'fleet' ? (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-brand-primary text-white py-3 px-6 rounded-2xl flex items-center space-x-3 shadow-lg shadow-brand-primary/20 text-xs font-black uppercase tracking-widest"
                        >
                            <UserPlus size={18} />
                            <span>Add Partner</span>
                        </button>
                    ) : (
                        <Link to="/admin/daily-closing/history" className="bg-gray-800 text-white py-3 px-6 rounded-2xl flex items-center space-x-3 text-xs font-black uppercase tracking-widest">
                            <History size={18} />
                            <span>History</span>
                        </Link>
                    )}
                </div>
            </div>

            {activeTab === 'fleet' ? (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Fleet</p>
                            <h3 className="text-2xl font-heading font-extrabold text-gray-800">{partners.length}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Currently Online</p>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <h3 className="text-2xl font-heading font-extrabold text-gray-800">{partners.filter(p => p.isOnline).length}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">On-Duty Partners</p>
                            <h3 className="text-2xl font-heading font-extrabold text-gray-800">{partners.filter(p => !p.isAvailable).length}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Delivery Time</p>
                            <h3 className="text-2xl font-heading font-extrabold text-gray-800">14.2 Min</h3>
                        </div>
                    </div>

                    {/* Partners Table */}
                    <div className="bg-white rounded-md shadow-card border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partner</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Efficiency</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Today's Earned</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Earnings</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    Array(3).fill(0).map((_, i) => <tr key={i}><td colSpan="7" className="p-6 text-center">Loading...</td></tr>)
                                ) : partners.map(partner => (
                                    <tr key={partner._id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold overflow-hidden border-2 border-white shadow-sm">
                                                    {partner.avatar ? <img src={partner.avatar} /> : <span>{partner.name[0]}</span>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{partner.name}</p>
                                                    <p className="text-[10px] text-gray-400">{partner.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2 text-xs font-bold text-gray-600">
                                                <Bike size={14} className="text-brand-primary" />
                                                <span>{partner.vehicleType}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 uppercase">{partner.vehicleNumber}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${partner.isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {partner.isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <p className="text-xs font-bold text-gray-700">92%</p>
                                            <div className="w-16 h-1 bg-gray-100 rounded-full mx-auto mt-1">
                                                <div className="bg-brand-accent h-full rounded-full" style={{ width: '92%' }} />
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-heading font-extrabold text-gray-800">₹440</td>
                                        <td className="p-4 text-right">
                                            <p className="font-heading font-extrabold text-green-600">₹{partner.totalEarnings?.toLocaleString() || 0}</p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <Link
                                                to={`/admin/delivery-partners/${partner._id}`}
                                                className="p-2 text-gray-400 hover:text-brand-primary transition-colors flex items-center justify-center"
                                            >
                                                <ExternalLink size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            <SummaryCard title="Total Orders" value={summary.totalOrders} icon={<ShoppingBag size={40} />} />
                            <SummaryCard title="Total Revenue" value={summary.totalRevenue} icon={<TrendingUp size={40} />} />
                            <SummaryCard title="Cash to Collect" value={summary.cashToCollect} icon={<IndianRupee size={40} />} subLabel="from COD" />
                            <SummaryCard title="Online Payments" value={summary.onlinePayments} icon={<CreditCard size={40} />} />
                            <SummaryCard title="Active Partners" value={summary.activePartners} icon={<Truck size={40} />} />
                            <SummaryCard title="Pending Closing" value={summary.pendingSettlements} icon={<ClipboardCheck size={40} />} />
                        </div>
                    )}

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Search by partner name..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-primary"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Partner</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Deliveries</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Cash Collected</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Payable</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Received</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="7" className="py-20 text-center uppercase text-xs font-black text-gray-400 animate-pulse tracking-widest">Syncing Accounts...</td></tr>
                                    ) : closingPartners.filter(p => p.partner.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => {
                                        const pId = item.partner._id;
                                        const settlement = settlementData[pId] || { amountSubmitted: 0, adminNotes: '' };
                                        const diff = item.amountToSubmit - settlement.amountSubmitted;
                                        const isClosed = item.settlement?.status === 'closed';

                                        return (
                                            <tr key={pId} className={`hover:bg-gray-50/50 transition-colors ${isClosed ? 'opacity-60 bg-green-50/10' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold overflow-hidden">
                                                            {item.partner.avatar ? <img src={item.partner.avatar} className="w-full h-full object-cover" /> : item.partner.name[0]}
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-800">{item.partner.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="text-sm font-black text-gray-800">{item.totalOrders}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="text-sm font-black text-gray-800">₹{item.codValue}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="text-sm font-black text-brand-primary">₹{Math.round(item.commissionEarned)}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="text-sm font-black text-gray-800">₹{Math.round(item.amountToSubmit)}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center space-y-2">
                                                        <div className="relative">
                                                            <input 
                                                                type="number" className="w-24 px-3 py-1.5 text-center bg-gray-50 border-none rounded-lg font-black text-sm focus:ring-2 focus:ring-brand-primary"
                                                                value={settlement.amountSubmitted}
                                                                onChange={(e) => handleInputChange(pId, 'amountSubmitted', e.target.value)}
                                                                disabled={isClosed}
                                                            />
                                                            {settlement.amountSubmitted > 0 && !isClosed && (
                                                                <div className="absolute -top-3 -right-3">
                                                                    {diff === 0 ? <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={12} /></div> : <div className={`px-2 py-0.5 rounded-full text-[8px] font-black text-white ${diff < 0 ? 'bg-blue-500' : 'bg-red-500'}`}>{diff < 0 ? 'Surplus' : `Short ₹${Math.abs(diff)}`}</div>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isClosed ? (
                                                        <div className="flex items-center justify-center text-green-600 font-black text-[10px] uppercase tracking-widest space-x-1">
                                                            <CheckCircle2 size={12} /> <span>Settled</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleCloseAccount(pId)}
                                                            className="p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-colors"
                                                        >
                                                            <Save size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Partner Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-2xl font-heading font-extrabold text-gray-800 uppercase tracking-widest mb-8">Add Delivery Partner</h2>

                            <form onSubmit={handleCreatePartner} className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-gray-50 border-none rounded-md p-3 focus:ring-2 focus:ring-brand-primary font-bold text-sm"
                                            value={newPartner.name}
                                            onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-gray-50 border-none rounded-md p-3 focus:ring-2 focus:ring-brand-primary font-bold text-sm"
                                            value={newPartner.phone}
                                            onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                                        <input
                                            type="email" required
                                            className="w-full bg-gray-50 border-none rounded-md p-3 focus:ring-2 focus:ring-brand-primary font-bold text-sm"
                                            value={newPartner.email}
                                            onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assign Password</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-gray-50 border-none rounded-md p-3 focus:ring-2 focus:ring-brand-primary font-bold text-sm"
                                            value={newPartner.password}
                                            onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-6">Vehicle & Identification</h4>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle Type</label>
                                            <select
                                                className="w-full bg-gray-50 border-none rounded-md p-3 focus:ring-2 focus:ring-brand-primary font-bold text-sm"
                                                value={newPartner.vehicleType}
                                                onChange={(e) => setNewPartner({ ...newPartner, vehicleType: e.target.value })}
                                            >
                                                <option>Bike</option><option>Scooter</option><option>Cycle</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle No.</label>
                                            <input
                                                type="text" required
                                                className="w-full bg-gray-50 border-none rounded-md p-3 focus:ring-2 focus:ring-brand-primary font-bold text-sm"
                                                value={newPartner.vehicleNumber}
                                                onChange={(e) => setNewPartner({ ...newPartner, vehicleNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">License No.</label>
                                            <input
                                                type="text" required
                                                className="w-full bg-gray-50 border-none rounded-md p-3 focus:ring-2 focus:ring-brand-primary font-bold text-sm"
                                                value={newPartner.licenseNumber}
                                                onChange={(e) => setNewPartner({ ...newPartner, licenseNumber: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 btn-primary rounded-md shadow-lg shadow-brand-primary/20"
                                    >
                                        Confirm Onboarding
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default DeliveryPartnerManagement;
