import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ShopData, Shop } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className="bg-accent/10 p-3 rounded-full">
            {icon}
        </div>
    </div>
);

const RevenueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const SalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4z" /></svg>;
const OrganicSalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const AdSalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.136a1.76 1.76 0 011.164-2.288l5.394-1.8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 13a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Dashboard: React.FC = () => {
    const [omzetData, setOmzetData] = useState<ShopData[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<string[]>(['Omzet', 'Total Penjualan']);
    
    const today = new Date();
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

    const [startDate, setStartDate] = useState<Date>(thirtyDaysAgo);
    const [endDate, setEndDate] = useState<Date>(today);

    useEffect(() => {
        const qData = query(collection(db, "Data Omzet Toko"), orderBy("createdAt", "desc"));
        const unsubscribeData = onSnapshot(qData, (querySnapshot) => {
            const data: ShopData[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as ShopData);
            });
            setOmzetData(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching data:", error);
            setLoading(false);
        });
        
        const qShops = query(collection(db, "TOKO"), orderBy("shopName", "asc"));
        const unsubscribeShops = onSnapshot(qShops, (querySnapshot) => {
            const shopList: Shop[] = [];
            querySnapshot.forEach((doc) => {
                shopList.push({ id: doc.id, ...doc.data() } as Shop);
            });
            setShops(shopList);
        });

        return () => {
            unsubscribeData();
            unsubscribeShops();
        };
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const { totalRevenue, totalSales, totalAdSales, totalOrganicSales, chartData } = useMemo(() => {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        const filteredData = omzetData.filter(d => {
            const saleDate = d.createdAt.toDate();
            const shopMatch = selectedShopId === 'all' || d.shopId === selectedShopId;
            const dateMatch = saleDate >= startOfDay && saleDate <= endOfDay;
            return shopMatch && dateMatch;
        });

        const totalRevenue = filteredData.reduce((acc, item) => acc + item.revenue, 0);
        const totalSales = filteredData.reduce((acc, item) => acc + item.totalSales, 0);
        const totalAdSales = filteredData.reduce((acc, item) => acc + item.adSales, 0);
        const totalOrganicSales = totalSales - totalAdSales;

        const dailyData = filteredData.reduce((acc: Record<string, { revenue: number, adSales: number, totalSales: number }>, sale) => {
            const saleDate = sale.createdAt.toDate();
            const year = saleDate.getFullYear();
            const month = String(saleDate.getMonth() + 1).padStart(2, '0');
            const day = String(saleDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            
            if (!acc[dateKey]) {
                acc[dateKey] = { revenue: 0, adSales: 0, totalSales: 0 };
            }
            acc[dateKey].revenue += sale.revenue;
            acc[dateKey].adSales += sale.adSales;
            acc[dateKey].totalSales += sale.totalSales;
            return acc;
        }, {} as Record<string, { revenue: number, adSales: number, totalSales: number }>);

        const chartData = Object.keys(dailyData)
            .map((dateKey) => {
                const localDate = new Date(`${dateKey}T00:00:00`);
                return {
                    name: localDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
                    date: localDate,
                    Omzet: dailyData[dateKey].revenue,
                    'Total Penjualan': dailyData[dateKey].totalSales,
                    'Penjualan Iklan': dailyData[dateKey].adSales,
                    'Penjualan Organik': dailyData[dateKey].totalSales - dailyData[dateKey].adSales
                };
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        return { totalRevenue, totalSales, totalAdSales, totalOrganicSales, chartData };
    }, [omzetData, selectedShopId, startDate, endDate]);

    const chartMetrics = [
        { key: 'Omzet', label: 'Omzet', color: '#6366F1' },
        { key: 'Total Penjualan', label: 'Total Penjualan', color: '#F59E0B' },
        { key: 'Penjualan Organik', label: 'Penjualan Organik', color: '#8B5CF6' },
        { key: 'Penjualan Iklan', label: 'Penjualan Iklan', color: '#34D399' }
    ];

    const handleFilterToggle = (filterKey: string) => {
        setActiveFilters(prev => 
            prev.includes(filterKey) 
                ? prev.filter(f => f !== filterKey) 
                : [...prev, filterKey]
        );
    };

    if (loading) {
        return <div className="text-center">Memuat data dasbor...</div>;
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">Dasbor</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Omzet" value={formatCurrency(totalRevenue)} icon={<RevenueIcon/>} />
                <StatCard title="Total Penjualan" value={totalSales.toLocaleString('id-ID')} icon={<SalesIcon/>} />
                <StatCard title="Penjualan Organik" value={totalOrganicSales.toLocaleString('id-ID')} icon={<OrganicSalesIcon/>} />
                <StatCard title="Total Penjualan Iklan" value={totalAdSales.toLocaleString('id-ID')} icon={<AdSalesIcon/>} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold text-gray-800">Grafik Performa</h3>
                    <div className="flex flex-wrap items-center gap-2">
                         <select
                            value={selectedShopId}
                            onChange={(e) => setSelectedShopId(e.target.value)}
                            className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                        >
                            <option value="all">Semua Toko</option>
                            {shops.map(shop => (
                                <option key={shop.id} value={shop.id}>{shop.shopName}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                             <input
                                type="date"
                                value={formatDateForInput(startDate)}
                                onChange={(e) => setStartDate(new Date(e.target.value + 'T00:00:00'))}
                                className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                            />
                             <span className="text-gray-500">-</span>
                            <input
                                type="date"
                                value={formatDateForInput(endDate)}
                                onChange={(e) => setEndDate(new Date(e.target.value + 'T00:00:00'))}
                                className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                            />
                        </div>
                        <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-gray-200 my-2 sm:my-0 sm:mx-2"></div>
                        {chartMetrics.map(metric => (
                            <button
                                key={metric.key}
                                onClick={() => handleFilterToggle(metric.key)}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    activeFilters.includes(metric.key)
                                        ? 'bg-accent text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {metric.label}
                            </button>
                        ))}
                    </div>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(Number(value))} />
                          <Tooltip 
                            formatter={(value, name) => {
                                if (name === 'Omzet') {
                                    return [formatCurrency(Number(value)), name];
                                }
                                return [Number(value).toLocaleString('id-ID'), name];
                            }}
                          />
                          <Legend />
                          {chartMetrics.map(metric => 
                            activeFilters.includes(metric.key) && (
                                <Line key={metric.key} type="monotone" dataKey={metric.key} stroke={metric.color} strokeWidth={2} activeDot={{ r: 8 }} />
                            )
                          )}
                      </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-16">
                    Tidak ada data untuk rentang tanggal yang dipilih.
                  </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;