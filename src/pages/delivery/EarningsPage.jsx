import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    IndianRupee,
    ChevronLeft,
    TrendingUp,
    Clock,
    CheckCircle2,
    ArrowRight,
    BarChart3,
    ArrowUpRight,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const StatBox = ({ label, value, icon, color }) => (
    <div className="bg-[#1B263B] p-8 rounded-[40px] border border-gray-700 shadow-2xl relative overflow-hidden group">
        <div className={`absolute -right-4 -top-4 p-8 opacity-10 group-hover:scale-110 transition-transform text-${color}`}>
            {icon}
        </div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[4px] mb-2">{label}</p>
        <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-black text-white tracking-tighter">₹{value.toLocaleString()}</span>
        </div>
    </div>
);

const EarningsPage = () => {
    const [stats, setStats] = useState({
        todayOrders: 0,
        todayEarnings: 0,
        monthEarnings: 0,
        totalEarned: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Mock data for weekly chart
    const weeklyData = [
        { day: 'Mon', earnings: 400 },
        { day: 'Tue', earnings: 600 },
        { day: 'Wed', earnings: 300 },
        { day: 'Thu', earnings: 800 },
        { day: 'Fri', earnings: 500 },
        { day: 'Sat', earnings: 1200 },
        { day: 'Sun', earnings: 950 },
    ];

    const { socket } = useSelector(state => state.auth);

    useEffect(() => {
        fetchEarnings();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('settlement:closed', (data) => {
                toast.success(data.message);
                fetchEarnings();
            });
            socket.on('settlement:dispute', (data) => {
                toast.error(data.message, { duration: 10000 });
                fetchEarnings();
            });
        }

        return () => {
            if (socket) {
                socket.off('settlement:closed');
                socket.off('settlement:dispute');
            }
        };
    }, [socket]);

    const fetchEarnings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/delivery/stats');
            setStats(data.stats);
        } catch (error) {
            toast.error('Failed to load earnings stats');
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            submitted: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            closed: 'bg-green-500/10 text-green-500 border-green-500/20',
            dispute: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
                {status}
            </span>
        );
    };

    if (loading) return (
        <div className="h-screen bg-[#0D1B2A] flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center space-x-4 mb-4">
                <button
                    onClick={() => navigate('/delivery/dashboard')}
                    className="p-3 bg-[#1B263B] rounded-xl text-gray-400 border border-gray-700"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-black text-white uppercase tracking-widest leading-none">Earnings</h1>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 gap-6">
                <StatBox
                    label="All Time Earnings"
                    value={stats.totalEarned}
                    icon={<IndianRupee size={32} />}
                    color="brand-primary"
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1B263B] p-4 rounded-3xl border border-gray-700 flex flex-col items-center text-center">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg mb-2">
                            <Clock size={16} />
                        </div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 leading-tight">Pending Payout</p>
                        <p className="text-xl font-black text-white leading-none">₹{Math.round(stats.monthEarnings * 0.4)}</p>
                    </div>
                    <div className="bg-[#1B263B] p-4 rounded-3xl border border-gray-700 flex flex-col items-center text-center">
                        <div className="p-2 bg-green-500/10 text-green-500 rounded-lg mb-2">
                            <CheckCircle2 size={16} />
                        </div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 leading-tight">Credited Today</p>
                        <p className="text-xl font-black text-white leading-none">₹{Math.round(stats.todayEarnings)}</p>
                    </div>
                </div>
            </div>

            {/* Today's Account Section */}
            <div className={`bg-[#1B263B] p-6 rounded-[32px] border ${stats.settlementStatus === 'dispute' ? 'border-red-500' : 'border-gray-700'} shadow-2xl relative overflow-hidden transition-colors`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Live Accounts</h4>
                        <p className="text-xl font-black text-white leading-tight underline decoration-brand-primary decoration-4 underline-offset-4">Today's Settlement</p>
                    </div>
                    <StatusBadge status={stats.settlementStatus || 'open'} />
                </div>

                {stats.settlementStatus === 'dispute' && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3">
                        <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                        <div>
                            <p className="text-xs font-black text-red-500 uppercase tracking-widest">Action Required</p>
                            <p className="text-[10px] text-red-400 font-bold mt-1 leading-relaxed uppercase">Discrepancy in your account for today. Please contact admin immediately for clarification.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-6">
                    <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-[2px] mb-1">Deliveries</p>
                        <p className="text-lg font-black text-white">{stats.todayOrders}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-[2px] mb-1">Commission (15%)</p>
                        <p className="text-lg font-black text-brand-primary">₹{Math.round(stats.todayEarnings)}</p>
                    </div>
                    <div className="col-span-2 h-px bg-gray-700/50"></div>
                    <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-[2px] mb-1">COD Collected</p>
                        <p className="text-lg font-black text-white">₹{Math.round(stats.todayCodCollected || 0)}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-orange-400 uppercase tracking-[2px] mb-1">Net to Submit</p>
                        <p className="text-lg font-black text-orange-400">₹{Math.round((stats.todayCodCollected || 0) - stats.todayEarnings)}</p>
                    </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-[2px] mb-2 text-center text-brand-primary">How This Works</p>
                    <p className="text-[9px] text-gray-400 font-bold text-center uppercase leading-loose">
                        Hand over <span className="text-white">₹{Math.round((stats.todayCodCollected || 0) - stats.todayEarnings)}</span> to the manager. 
                        Once they verify, your status will change to <span className="text-green-500">CLOSED</span> and ₹{Math.round(stats.todayEarnings)} will be credited.
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-[#1B263B] p-8 rounded-[40px] border border-gray-700 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Weekly Performance</h4>
                        <p className="text-xl font-black text-white leading-tight underline decoration-coral-accent decoration-2 underline-offset-4">Activity Chart</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-2xl text-gray-400 border border-gray-700 shadow-inner">
                        <BarChart3 size={20} />
                    </div>
                </div>

                <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                            <XAxis
                                dataKey="day"
                                stroke="#4B5563"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9CA3AF', fontWeight: 'bold' }}
                            />
                            <Tooltip
                                cursor={{ fill: '#1F2937', opacity: 0.5 }}
                                contentStyle={{
                                    backgroundColor: '#1B263B',
                                    borderRadius: '16px',
                                    border: '1px solid #374151',
                                    fontWeight: 'bold',
                                    fontSize: '12px',
                                    color: '#FFF'
                                }}
                            />
                            <Bar dataKey="earnings" radius={[6, 6, 6, 6]}>
                                {weeklyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 5 ? '#FF7B54' : '#FF7B5433'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-8 flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-widest">
                    <span>Mon (₹400)</span>
                    <span>Sun (₹950)</span>
                </div>
            </div>

            {/* Payout Action */}
            <button className="w-full py-5 rounded-2xl bg-[#0D1B2A] border border-coral-accent/20 text-coral-accent font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-xl p-4">
                <span>Contact Admin for Payout</span>
                <ExternalLink size={16} />
            </button>

            <div className="bg-[#1B263B] p-6 rounded-3xl border border-gray-700 border-dashed text-center">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-loose">
                    Commissions are calculated as 15% of the order value.
                    Payouts are processed every Monday.
                </p>
            </div>
        </div>
    );
};

export default EarningsPage;
