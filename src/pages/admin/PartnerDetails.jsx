import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    ChevronLeft,
    Bike,
    Phone,
    Trophy,
    Clock,
    BarChart3,
    Star,
    MapPin,
    ArrowUpRight,
    CreditCard,
    CheckCircle2,
    Wallet,
    Edit3,
    X,
    Save,
    Percent
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PartnerDetails = () => {
    const { id } = useParams();
    const [partner, setPartner] = useState(null);
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        vehicleType: '',
        vehicleNumber: '',
        licenseNumber: '',
        commissionRate: 15,
        bankHolderName: '',
        bankAccountNo: '',
        bankIfsc: '',
    });

    useEffect(() => {
        fetchPartnerDetails();
    }, [id]);

    const fetchPartnerDetails = async () => {
        try {
            const { data } = await api.get(`/admin/delivery-partners/${id}`);
            setPartner(data.partner);
            setCommissions(data.commissions);
        } catch (error) {
            toast.error('Failed to load partner details');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = () => {
        if (!partner) return;
        setEditForm({
            name: partner.name || '',
            phone: partner.phone || '',
            vehicleType: partner.vehicleType || '',
            vehicleNumber: partner.vehicleNumber || '',
            licenseNumber: partner.licenseNumber || '',
            commissionRate: Math.round((partner.commissionRate || 0.15) * 100),
            bankHolderName: partner.bankDetails?.holderName || '',
            bankAccountNo: partner.bankDetails?.accountNo || '',
            bankIfsc: partner.bankDetails?.ifsc || '',
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await api.patch(`/admin/delivery-partners/${id}`, {
                name: editForm.name,
                phone: editForm.phone,
                vehicleType: editForm.vehicleType,
                vehicleNumber: editForm.vehicleNumber,
                licenseNumber: editForm.licenseNumber,
                commissionRate: parseFloat(editForm.commissionRate) / 100,
                bankDetails: {
                    holderName: editForm.bankHolderName,
                    accountNo: editForm.bankAccountNo,
                    ifsc: editForm.bankIfsc,
                }
            });
            toast.success('Partner details updated!');
            setShowEditModal(false);
            fetchPartnerDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleCreditPayment = async (commId) => {
        try {
            await api.patch(`/admin/commissions/${commId}/credit`);
            toast.success('Commission credited');
            fetchPartnerDetails();
        } catch (error) {
            toast.error('Failed to credit payment');
        }
    };

    const handleBulkCredit = async () => {
        try {
            await api.patch(`/admin/commissions/bulk-credit/${id}`);
            toast.success('All pending commissions credited');
            fetchPartnerDetails();
        } catch (error) {
            toast.error('Bulk operation failed');
        }
    };

    const chartData = [
        { name: 'Mon', earnings: 400 },
        { name: 'Tue', earnings: 300 },
        { name: 'Wed', earnings: 700 },
        { name: 'Thu', earnings: 200 },
        { name: 'Fri', earnings: 900 },
        { name: 'Sat', earnings: 1200 },
        { name: 'Sun', earnings: 800 },
    ];

    if (loading) return <AdminLayout><div className="p-12 text-center text-gray-400 font-bold">Loading Partner Data...</div></AdminLayout>;
    if (!partner) return <AdminLayout>Partner not found</AdminLayout>;

    const pendingTotal = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0);

    return (
        <AdminLayout>
            <div className="mb-10">
                <Link to="/admin/delivery-partners" className="flex items-center space-x-2 text-gray-400 hover:text-brand-primary transition-colors text-[10px] font-bold uppercase tracking-widest mb-4">
                    <ChevronLeft size={16} />
                    <span>Back to Fleet</span>
                </Link>
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-3xl overflow-hidden border-4 border-white shadow-xl">
                            {partner.avatar ? <img src={partner.avatar} alt={partner.name} /> : <span>{partner.name[0]}</span>}
                        </div>
                        <div>
                            <h1 className="text-3xl font-heading font-extrabold text-gray-800 uppercase tracking-tighter">{partner.name}</h1>
                            <div className="flex items-center space-x-4 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${partner.isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {partner.isOnline ? 'Online' : 'Offline'}
                                </span>
                                <p className="text-xs font-bold text-gray-600 flex items-center"><Bike size={14} className="mr-1 text-brand-primary" /> {partner.vehicleNumber || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    {/* Edit Button */}
                    <button
                        onClick={openEditModal}
                        className="flex items-center space-x-2 bg-brand-primary text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                    >
                        <Edit3 size={14} />
                        <span>Edit Partner</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                            <Trophy size={20} className="text-brand-primary mb-3" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
                            <h3 className="text-2xl font-heading font-extrabold text-gray-800">{partner.totalOrders || 0}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                            <Percent size={20} className="text-brand-accent mb-3" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commission Rate</p>
                            <h3 className="text-2xl font-heading font-extrabold text-gray-800">{Math.round((partner.commissionRate || 0.15) * 100)}%</h3>
                        </div>
                        <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                            <Wallet size={20} className="text-orange-400 mb-3" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Earnings</p>
                            <h3 className="text-2xl font-heading font-extrabold text-gray-800">₹{partner.totalEarnings || 0}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-md shadow-card border border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Weekly Earnings Growth</h4>
                            <div className="flex items-center space-x-2 text-green-500 font-bold text-xs uppercase">
                                <ArrowUpRight size={14} />
                                <span>+12.4% vs last week</span>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF5733" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#FF5733" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="earnings" stroke="#FF5733" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Commissions Table */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Commission & Payout History</h4>
                            {pendingTotal > 0 && (
                                <button
                                    onClick={handleBulkCredit}
                                    className="text-[10px] font-bold text-brand-primary uppercase underline hover:no-underline"
                                >
                                    Pay All Pending (₹{pendingTotal})
                                </button>
                            )}
                        </div>
                        <div className="bg-white rounded-md shadow-card border border-gray-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase">Order ID</th>
                                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase">Date</th>
                                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase">Order Value</th>
                                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase">Rate</th>
                                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase">Amount</th>
                                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase">Status</th>
                                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {commissions.length === 0 ? (
                                        <tr><td colSpan="7" className="p-10 text-center text-gray-300 text-xs font-bold uppercase">No history found</td></tr>
                                    ) : commissions.map(comm => (
                                        <tr key={comm._id} className="text-xs font-bold">
                                            <td className="p-4 text-gray-700">#{comm.order?.orderId || 'N/A'}</td>
                                            <td className="p-4 text-gray-500 font-medium">{format(new Date(comm.createdAt), 'dd MMM yyyy')}</td>
                                            <td className="p-4">₹{comm.orderValue}</td>
                                            <td className="p-4 text-brand-primary">{comm.commissionRate}%</td>
                                            <td className="p-4 font-heading text-gray-800">₹{comm.commissionAmount}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] uppercase ${comm.status === 'credited' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {comm.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {comm.status === 'pending' ? (
                                                    <button
                                                        onClick={() => handleCreditPayment(comm._id)}
                                                        className="p-1.5 bg-brand-primary/10 text-brand-primary rounded-md hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                                                    >
                                                        <CreditCard size={14} />
                                                    </button>
                                                ) : <CheckCircle2 size={16} className="text-green-500 mx-auto" />}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-10">
                    <div className="bg-dark-bg text-white p-8 rounded-md shadow-xl border border-white/5">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Partner Details</h4>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Vehicle Info</p>
                                <p className="text-sm font-bold">{partner.vehicleType || 'N/A'} - {partner.vehicleNumber || 'N/A'}</p>
                                <p className="text-[10px] opacity-50 font-bold uppercase">DL: {partner.licenseNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Contact Details</p>
                                <p className="text-sm font-bold">{partner.email}</p>
                                <p className="text-sm font-bold">{partner.phone}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Payout Account</p>
                                <p className="text-sm font-bold">{partner.bankDetails?.holderName || 'Not set'}</p>
                                <p className="text-xs font-bold opacity-60">{partner.bankDetails?.accountNo || '—'}</p>
                                <p className="text-[10px] opacity-40 font-bold uppercase">IFSC: {partner.bankDetails?.ifsc || '—'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-primary/5 p-6 rounded-md border border-brand-primary/10">
                        <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-2 flex items-center justify-between">
                            Pending Payout
                            <Wallet size={14} />
                        </h4>
                        <h3 className="text-3xl font-heading font-extrabold text-gray-800">₹{pendingTotal.toLocaleString()}</h3>
                        <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Sum of all pending commissions</p>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setShowEditModal(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-800 uppercase tracking-tight">Edit Partner</h2>
                                <p className="text-xs text-gray-400 font-bold mt-0.5">{partner.name}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-gray-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Basic Info */}
                                <div className="md:col-span-2">
                                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Basic Information</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                                    <input name="name" value={editForm.name} onChange={handleEditChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-primary transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Phone Number</label>
                                    <input name="phone" value={editForm.phone} onChange={handleEditChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-primary transition-colors" />
                                </div>

                                {/* Vehicle Info */}
                                <div className="md:col-span-2 mt-2">
                                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Vehicle Information</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Vehicle Type</label>
                                    <select name="vehicleType" value={editForm.vehicleType} onChange={handleEditChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-primary transition-colors">
                                        <option value="">Select type</option>
                                        <option value="Bike">Bike</option>
                                        <option value="Scooter">Scooter</option>
                                        <option value="Cycle">Cycle</option>
                                        <option value="Car">Car</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Vehicle Number</label>
                                    <input name="vehicleNumber" value={editForm.vehicleNumber} onChange={handleEditChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-primary transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">License Number (DL)</label>
                                    <input name="licenseNumber" value={editForm.licenseNumber} onChange={handleEditChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-primary transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Commission Rate (%)</label>
                                    <div className="relative">
                                        <input name="commissionRate" type="number" min="1" max="50" value={editForm.commissionRate} onChange={handleEditChange}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-primary transition-colors pr-10" />
                                        <Percent size={14} className="absolute right-3 top-3 text-gray-400" />
                                    </div>
                                </div>

                                {/* Bank Details */}
                                <div className="md:col-span-2 mt-2">
                                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Bank / Payout Details</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Account Holder Name</label>
                                    <input name="bankHolderName" value={editForm.bankHolderName} onChange={handleEditChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-primary transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Account Number</label>
                                    <input name="bankAccountNo" value={editForm.bankAccountNo} onChange={handleEditChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-primary transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">IFSC Code</label>
                                    <input name="bankIfsc" value={editForm.bankIfsc} onChange={handleEditChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-brand-primary transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                            <button onClick={() => setShowEditModal(false)} disabled={saving}
                                className="px-6 py-2.5 text-xs font-bold text-gray-600 uppercase tracking-widest hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSaveEdit} disabled={saving}
                                className="flex items-center space-x-2 bg-brand-primary text-white px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-60">
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={14} />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default PartnerDetails;
