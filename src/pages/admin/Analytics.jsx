import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    Download,
    Calendar,
    TrendingUp,
    ArrowUpRight,
    ChevronDown,
    Activity,
    Users,
    ShoppingBag,
    DollarSign
} from 'lucide-react';
import api from '../../utils/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#FF5733', '#0D1B2A', '#FFA500', '#22C55E', '#3B82F6', '#6366F1'];

const Analytics = () => {
    const [range, setRange] = useState('30d');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [range]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/analytics', { params: { range } });
            setData(data);
        } catch (error) {
            console.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <AdminLayout><div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Generating Reports...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-heading font-extrabold text-gray-800 uppercase tracking-tighter">Business Intelligence</h1>
                    <p className="text-sm text-gray-500 mt-1">Deep dive into sales, customer behaviors and logistics efficiency</p>
                </div>
                <div className="flex space-x-4">
                    <div className="relative">
                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            className="bg-white border border-gray-100 rounded-md px-4 py-2 text-xs font-bold font-heading pr-10 appearance-none shadow-sm cursor-pointer"
                        >
                            <option value="7d">LAST 7 DAYS</option>
                            <option value="30d">LAST 30 DAYS</option>
                            <option value="90d">LAST 90 DAYS</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <button className="bg-dark-bg text-white px-6 py-2 rounded-md text-xs font-bold font-heading flex items-center space-x-2 shadow-lg shadow-dark-bg/20">
                        <Download size={14} />
                        <span>EXPORT CSV</span>
                    </button>
                </div>
            </div>

            {/* Top Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                <div className="bg-white p-8 rounded-md shadow-card border border-gray-100 relative overflow-hidden group hover:border-brand-primary transition-all">
                    <div className="absolute -top-4 -right-4 bg-brand-primary/5 w-20 h-20 rounded-full group-hover:scale-150 transition-transform duration-500" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Net Sales</p>
                    <h3 className="text-2xl font-heading font-extrabold text-gray-800 relative z-10">₹8,49,200</h3>
                    <div className="flex items-center text-green-500 text-[10px] font-bold uppercase mt-2 relative z-10">
                        <TrendingUp size={12} className="mr-1" />
                        <span>+12% WoW</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-md shadow-card border border-gray-100 group hover:border-brand-accent transition-all">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                    <h3 className="text-2xl font-heading font-extrabold text-gray-800">4,212</h3>
                    <div className="flex items-center text-brand-primary text-[10px] font-bold uppercase mt-2">
                        <Activity size={12} className="mr-1" />
                        <span>98% Fulfillment</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-md shadow-card border border-gray-100 group hover:border-brand-secondary transition-all">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">New Customers</p>
                    <h3 className="text-2xl font-heading font-extrabold text-gray-800">+1,420</h3>
                    <div className="flex items-center text-green-500 text-[10px] font-bold uppercase mt-2">
                        <ArrowUpRight size={12} className="mr-1" />
                        <span>Growing Fast</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-md shadow-card border border-gray-100 group hover:border-dark-bg transition-all">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Order Value</p>
                    <h3 className="text-2xl font-heading font-extrabold text-gray-800">₹242</h3>
                    <div className="flex items-center text-gray-400 text-[10px] font-bold uppercase mt-2">
                        <Calendar size={12} className="mr-1" />
                        <span>Steady Growth</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                {/* Revenue Growth Chart */}
                <div className="bg-white p-8 rounded-md shadow-card border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-10">Revenue Trend (₹)</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueOverTime?.length > 0 ? data.revenueOverTime : [
                                { date: '2023-10-01', revenue: 4000 },
                                { date: '2023-10-02', revenue: 3000 },
                                { date: '2023-10-03', revenue: 5000 },
                                { date: '2023-10-04', revenue: 2780 },
                                { date: '2023-10-05', revenue: 1890 },
                                { date: '2023-10-06', revenue: 2390 },
                                { date: '2023-10-07', revenue: 3490 },
                            ]}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF5733" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#FF5733" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#9ca3af' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#FF5733" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders by Status */}
                <div className="bg-white p-8 rounded-md shadow-card border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-10">Orders by Status Distribution</h4>
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.ordersByStatus?.length > 0 ? data.ordersByStatus : [
                                        { name: 'Delivered', value: 400 },
                                        { name: 'On The Way', value: 300 },
                                        { name: 'Confirmed', value: 300 },
                                        { name: 'Cancelled', value: 200 },
                                    ]}
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(data?.ordersByStatus || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Top Products */}
                <div className="bg-white p-8 rounded-md shadow-card border border-gray-100 lg:col-span-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-10">Top Performing Products (by Volume)</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.topProducts || [
                                { name: 'Amul Milk', soldCount: 120 },
                                { name: 'Aashirvaad Atta', soldCount: 98 },
                                { name: 'Fortune Oil', soldCount: 86 },
                                { name: 'Lays Chips', soldCount: 72 },
                                { name: 'Coke 250ml', soldCount: 65 },
                            ]} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#374151' }} width={120} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="soldCount" fill="#0D1B2A" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Logistics Stats */}
                <div className="space-y-8">
                    <div className="bg-dark-bg text-white p-8 rounded-md shadow-xl border border-white/5 h-full">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-10 border-b border-white/5 pb-2">Logistics Performance</h4>
                        <div className="space-y-10">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-white/60 uppercase">Delivery SLA Met</span>
                                    <span className="text-xs font-bold text-green-400">92.5%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-green-400 h-full rounded-full" style={{ width: '92.5%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-white/60 uppercase">Partner Utilization</span>
                                    <span className="text-xs font-bold text-brand-primary">78.2%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-brand-primary h-full rounded-full" style={{ width: '78.2%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-white/60 uppercase">Order Accuracy</span>
                                    <span className="text-xs font-bold text-brand-accent">99.8%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-brand-accent h-full rounded-full" style={{ width: '99.8%' }} />
                                </div>
                            </div>

                            <div className="pt-8 grid grid-cols-2 gap-4 border-t border-white/5">
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Pick up delay</p>
                                    <p className="text-lg font-bold">1.2m</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">In-transit avg</p>
                                    <p className="text-lg font-bold">8.4m</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Analytics;
