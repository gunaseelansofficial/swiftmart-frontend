import AdminLayout from '../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    ShoppingBag,
    Users,
    Activity,
    Package,
    AlertTriangle,
    Bell,
    CheckCircle,
    Trophy
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const data = [
    { name: 'Mon', revenue: 4000, orders: 24 },
    { name: 'Tue', revenue: 3000, orders: 18 },
    { name: 'Wed', revenue: 2000, orders: 20 },
    { name: 'Thu', revenue: 2780, orders: 39 },
    { name: 'Fri', revenue: 1890, orders: 48 },
    { name: 'Sat', revenue: 2390, orders: 38 },
    { name: 'Sun', revenue: 3490, orders: 43 },
];

const StatCard = ({ title, value, icon, change, isPositive }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white p-6 rounded-md shadow-card border border-gray-100"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-brand-primary/5 rounded-lg text-brand-primary">
                {icon}
            </div>
            <div className={`flex items-center space-x-1 text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                <span>{change}</span>
                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            </div>
        </div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-heading font-extrabold text-gray-800">{value}</h3>
    </motion.div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        lowStockProducts: 0,
        onlinePartners: 0
    });
    const [liveOrders, setLiveOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [restockValues, setRestockValues] = useState({});
    const socketRef = useRef(null);

    useEffect(() => {
        fetchStats();
        fetchSecondaryData();

        socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        socketRef.current.on('order:new', (newOrder) => {
            setLiveOrders(prev => [newOrder, ...prev].slice(0, 10));
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => { });
            toast('New Order Received!', { icon: '🔔' });
        });

        return () => socketRef.current.disconnect();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/admin/dashboard/stats');
            setStats(data.stats);
            if (data.lowStock) setLowStock(data.lowStock);
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const fetchSecondaryData = async () => {
        try {
            const { data } = await api.get('/admin/analytics', { params: { range: '7d' } });
            setTopProducts(data.topProducts);
        } catch (error) {
            console.error('Failed to fetch analytical data');
        }
    };

    const handleRestock = async (pid) => {
        const value = restockValues[pid];
        if (!value || isNaN(value)) return toast.error('Enter valid amount');

        try {
            await api.patch(`/products/${pid}/stock`, { stock: parseInt(value) });
            toast.success('Stock updated!');
            setRestockValues({ ...restockValues, [pid]: '' });
            fetchStats();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-heading font-extrabold text-gray-800 uppercase tracking-widest">Global Overview</h1>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Live</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Net Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign size={24} />} change="+15.4%" isPositive={true} />
                <StatCard title="Gross Orders" value={stats.totalOrders} icon={<ShoppingBag size={24} />} change="+22.1%" isPositive={true} />
                <StatCard title="Critical Stock" value={stats.lowStockProducts} icon={<Package size={24} />} change="-2" isPositive={false} />
                <StatCard title="Partners Online" value={stats.onlinePartners} icon={<Users size={24} />} change="+5" isPositive={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-md shadow-card border border-gray-100">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue Forecast (Weekly)</h3>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-brand-primary" /><span className="text-[9px] font-bold text-gray-400 uppercase">Revenue</span></div>
                            <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-brand-accent" /><span className="text-[9px] font-bold text-gray-400 uppercase">Growth</span></div>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                                <Line type="monotone" dataKey="revenue" stroke="#FF5733" strokeWidth={4} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-dark-bg text-white p-8 rounded-md shadow-2xl border border-white/5 flex flex-col">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8 border-b border-white/5 pb-2">Logistics Health</h3>
                    <div className="space-y-8 flex-1">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-bold uppercase tracking-tight text-white/40">Fulfillment Rate</span>
                                <span className="text-xs font-bold text-green-400">98.2%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden"><div className="bg-green-400 h-full" style={{ width: '98.2%' }} /></div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-bold uppercase tracking-tight text-white/40">Active Deliveries</span>
                                <span className="text-xs font-bold text-brand-primary">{stats.onlinePartners} Online</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden"><div className="bg-brand-primary h-full" style={{ width: '80%' }} /></div>
                        </div>
                    </div>

                    <div className="mt-8 bg-white/5 p-4 rounded-md border border-white/5 text-center">
                        <p className="text-[10px] font-bold uppercase text-brand-accent mb-2">{stats.lowStockProducts} Critical Alerts</p>
                        <button className="w-full py-2 bg-brand-primary hover:bg-brand-secondary transition-all rounded text-[10px] font-bold uppercase">Restock View</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-md shadow-card border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center space-x-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                            </span>
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Live Orders Feed</h3>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{liveOrders.length} Recent</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <AnimatePresence>
                            {liveOrders.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50 space-y-3">
                                    <Bell size={48} />
                                    <p className="text-xs font-bold uppercase tracking-widest">Waiting for orders...</p>
                                </div>
                            ) : liveOrders.map((order, idx) => (
                                <motion.div key={order._id || idx} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="p-4 bg-gray-50 rounded-md border-l-4 border-brand-primary flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">#{order.orderId || order._id.slice(-6).toUpperCase()}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{order.customer?.name || 'Customer'} • ₹{order.totalAmount}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Status</p>
                                        <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[8px] font-bold uppercase">{order.status}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-md shadow-card border border-gray-100 p-6">
                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-6 flex items-center">
                            <Package size={16} className="mr-2 text-brand-primary" />
                            Stock Watchlist
                        </h3>
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                            {lowStock.length === 0 ? (
                                <p className="text-xs text-center text-gray-400 py-10 font-bold">All stock levels healthy ✅</p>
                            ) : lowStock.map(item => (
                                <div key={item._id} className="flex flex-col p-4 bg-red-50 rounded-md border border-red-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Current: {item.stock} Units</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <input
                                            type="number"
                                            placeholder="Set Total"
                                            value={restockValues[item._id] || ''}
                                            onChange={(e) => setRestockValues({ ...restockValues, [item._id]: e.target.value })}
                                            className="flex-1 bg-white border border-red-200 px-3 py-1.5 rounded-md text-xs focus:ring-1 focus:ring-brand-primary outline-none"
                                        />
                                        <button
                                            onClick={() => handleRestock(item._id)}
                                            className="px-4 py-1.5 bg-brand-secondary text-white text-[10px] font-bold uppercase rounded-md shadow-sm hover:bg-brand-primary transition-all"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-md shadow-card border border-gray-100 p-6">
                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-6 flex items-center">
                            <Trophy size={16} className="mr-2 text-brand-accent" />
                            Best Sellers
                        </h3>
                        <div className="space-y-4">
                            {topProducts.length === 0 ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex justify-between"><div className="h-4 w-32 bg-gray-100 rounded" /><div className="h-4 w-12 bg-gray-100 rounded" /></div>
                                    ))}
                                </div>
                            ) : topProducts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded bg-gray-100 font-bold flex items-center justify-center text-[10px] text-gray-400">#{i + 1}</div>
                                        <span className="text-sm font-bold text-gray-700">{p.name}</span>
                                    </div>
                                    <span className="text-xs font-heading font-extrabold text-brand-primary">{p.soldCount} Sold</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
