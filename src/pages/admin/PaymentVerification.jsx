import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    CreditCard,
    CheckCircle,
    XCircle,
    RefreshCcw,
    Search,
    AlertCircle,
    Activity
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PaymentVerification = () => {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        failed: 0,
        refunded: 0
    });
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, [activeTab]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            // Reusing getAllOrders filter to get payments
            const { data } = await api.get('/admin/orders', {
                params: { paymentStatus: activeTab === 'all' ? 'All' : activeTab }
            });
            setPayments(data.orders);

            // In a real app, you'd have a separate stats endpoint
            setStats({
                total: 542000,
                pending: data.total,
                failed: 12,
                refunded: 4500
            });
        } catch (error) {
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id) => {
        try {
            await api.patch(`/admin/payments/${id}/verify`);
            toast.success('Payment verified successfully');
            fetchPayments();
        } catch (error) {
            toast.error('Verification failed');
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-heading font-extrabold text-gray-800 uppercase tracking-widest">Payment Verification</h1>
                <p className="text-sm text-gray-500 mt-1">Review and reconcile gateway payments and COD collections</p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Verified Revenue</span>
                        <div className="text-green-500"><Activity size={16} /></div>
                    </div>
                    <p className="text-2xl font-heading font-extrabold text-gray-800 font-heading">₹{stats.total.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Verification</span>
                        <div className="text-orange-500"><AlertCircle size={16} /></div>
                    </div>
                    <p className="text-2xl font-heading font-extrabold text-gray-800 font-heading">{stats.pending}</p>
                </div>
                <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Failed Payments</span>
                        <div className="text-red-500"><XCircle size={16} /></div>
                    </div>
                    <p className="text-2xl font-heading font-extrabold text-gray-800 font-heading">{stats.failed}</p>
                </div>
                <div className="bg-white p-6 rounded-md shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Refunded</span>
                        <div className="text-brand-primary"><RefreshCcw size={16} /></div>
                    </div>
                    <p className="text-2xl font-heading font-extrabold text-gray-800 font-heading">₹{stats.refunded.toLocaleString()}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-8 mb-8 border-b border-gray-100">
                {['pending', 'completed', 'failed', 'all'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full" />}
                    </button>
                ))}
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-md shadow-card border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Method</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ref ID</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created At</th>
                            <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i}><td colSpan="7" className="p-6 text-center text-gray-400">Loading...</td></tr>
                            ))
                        ) : payments.length === 0 ? (
                            <tr><td colSpan="7" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No pending verifications</td></tr>
                        ) : payments.map(order => (
                            <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 font-bold text-gray-700 text-xs text-brand-primary">#{order.orderId}</td>
                                <td className="p-4">
                                    <p className="text-sm font-bold text-gray-800">{order.customer?.name}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">{order.customer?.email}</p>
                                </td>
                                <td className="p-4 font-heading font-extrabold text-gray-800">₹{order.totalAmount}</td>
                                <td className="p-4">
                                    <span className="flex items-center space-x-2 text-[10px] font-bold text-gray-600 uppercase">
                                        <CreditCard size={12} className="text-gray-400" />
                                        <span>{order.payment.method}</span>
                                    </span>
                                </td>
                                <td className="p-4 font-mono text-[10px] text-gray-400">
                                    {order.payment.razorpayPaymentId || 'N/A (Offline)'}
                                </td>
                                <td className="p-4 text-xs font-bold text-gray-500">
                                    {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                                </td>
                                <td className="p-4 text-center">
                                    {order.payment.status === 'pending' ? (
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                onClick={() => handleVerify(order._id)}
                                                className="p-2 bg-green-500/10 text-green-600 rounded-md hover:bg-green-600 hover:text-white transition-all"
                                                title="Verify Payment"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                className="p-2 bg-red-500/10 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-all"
                                                title="Mark Failed"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[9px] font-bold uppercase tracking-widest">Verified</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Webhook Logs mockup */}
            <div className="mt-12">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Webhook Events (Razorpay)</h4>
                <div className="bg-dark-bg rounded-md overflow-hidden text-white/80 font-mono text-[11px]">
                    <div className="grid grid-cols-4 p-4 border-b border-white/5 opacity-50 font-bold">
                        <span>EVENT</span><span>ORDER ID</span><span>GATEWAY ID</span><span>TIMESTAMP</span>
                    </div>
                    {[
                        { ev: 'payment.captured', oid: 'SW-9821', gid: 'pay_Nj21zWq', time: '2023-10-25 14:21:05' },
                        { ev: 'order.paid', oid: 'SW-9820', gid: 'ord_Kja1902', time: '2023-10-25 14:15:22' },
                        { ev: 'payment.failed', oid: 'SW-9819', gid: 'pay_Nj19xAo', time: '2023-10-25 13:58:11' }
                    ].map((log, i) => (
                        <div key={i} className="grid grid-cols-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <span className="text-green-400">{log.ev}</span>
                            <span className="text-brand-primary">#{log.oid}</span>
                            <span>{log.gid}</span>
                            <span className="opacity-50">{log.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

export default PaymentVerification;
