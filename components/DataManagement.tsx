import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy, where } from 'firebase/firestore';
import { ShopData, NewShopData, Shop, Admin } from '../types';

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);
const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const initialFormState = {
    revenue: 0,
    totalSales: 0,
    adSales: 0,
    adROI: 0,
    tanggal: new Date().toISOString().split('T')[0]
};

const DataManagement: React.FC = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [omzetData, setOmzetData] = useState<ShopData[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<ShopData | null>(null);
    const [formData, setFormData] = useState(initialFormState);

    const [formattedValues, setFormattedValues] = useState({
        revenue: '0',
        totalSales: '0',
        adSales: '0',
    });

    useEffect(() => {
        const q = query(collection(db, "ADMIN"), orderBy("adminName", "asc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list: Admin[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Admin);
            });
            setAdmins(list);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!selectedAdminId) {
            setShops([]);
            return;
        }
        
        const q = query(collection(db, "TOKO"), where("adminId", "==", selectedAdminId));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list: Shop[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Shop);
            });
            list.sort((a, b) => a.shopName.localeCompare(b.shopName));
            setShops(list);
        }, (error) => console.error("Error fetching shops:", error));
        return () => unsubscribe();
    }, [selectedAdminId]);


    useEffect(() => {
        if (!selectedShopId) {
            setOmzetData([]);
            setLoadingData(false);
            return;
        }

        setLoadingData(true);
        const q = query(collection(db, "Data Omzet Toko"), where("shopId", "==", selectedShopId));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: ShopData[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as ShopData);
            });
            data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setOmzetData(data);
            setLoadingData(false);
        }, (error) => {
            console.error("Error fetching omzet data:", error);
            setLoadingData(false);
        });
        return () => unsubscribe();
    }, [selectedShopId]);
    
    const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);
    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    const openModal = (item: ShopData | null = null) => {
        setCurrentItem(item);
        if (item) {
            setFormData({
                revenue: item.revenue,
                totalSales: item.totalSales,
                adSales: item.adSales,
                adROI: item.adROI,
                tanggal: item.createdAt.toDate().toISOString().split('T')[0]
            });
            setFormattedValues({
                revenue: formatNumber(item.revenue),
                totalSales: formatNumber(item.totalSales),
                adSales: formatNumber(item.adSales),
            });
        } else {
            setFormData(initialFormState);
            setFormattedValues({ revenue: '0', totalSales: '0', adSales: '0' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
        
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        setFormattedValues(prev => ({ ...prev, [name]: formatNumber(numericValue) }));
    };
    
    const handleDecimalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShopId) {
            alert("Silakan pilih toko terlebih dahulu.");
            return;
        }
        
        const { tanggal, ...restOfFormData } = formData;
        const createdAtTimestamp = Timestamp.fromDate(new Date(tanggal + 'T00:00:00'));

        const dataToSave: NewShopData & { createdAt: Timestamp } = { 
            ...restOfFormData, 
            createdAt: createdAtTimestamp,
            shopId: selectedShopId,
        };
        
        if (currentItem) {
            await updateDoc(doc(db, "Data Omzet Toko", currentItem.id), dataToSave);
        } else {
            await addDoc(collection(db, "Data Omzet Toko"), dataToSave);
        }
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            await deleteDoc(doc(db, "Data Omzet Toko", id));
        }
    };
    
    const getTableMessage = () => {
        if (loadingData) return "Memuat data...";
        if (!selectedAdminId) return "Silakan pilih admin untuk memulai.";
        if (!selectedShopId) return "Silakan pilih toko untuk melihat data.";
        if (omzetData.length === 0) return "Tidak ada data untuk toko ini.";
        return "";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Data Omzet Toko</h2>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                        id="admin-select"
                        value={selectedAdminId}
                        onChange={(e) => {
                            setSelectedAdminId(e.target.value);
                            setSelectedShopId('');
                        }}
                        className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    >
                        <option value="">-- Pilih Admin --</option>
                        {admins.map(admin => <option key={admin.id} value={admin.id}>{admin.adminName}</option>)}
                    </select>
                    
                    <select
                        id="shop-select"
                        value={selectedShopId}
                        onChange={(e) => setSelectedShopId(e.target.value)}
                        disabled={!selectedAdminId}
                        className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm disabled:bg-gray-100"
                    >
                        <option value="">-- Pilih Toko --</option>
                        {shops.map(toko => <option key={toko.id} value={toko.id}>{toko.shopName}</option>)}
                    </select>
                    <button onClick={() => openModal()} disabled={!selectedShopId} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300 disabled:cursor-not-allowed">
                        <PlusIcon className="w-5 h-5"/>
                        <span>Tambah Data</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Omzet', 'Total Penjualan', 'Penjualan Iklan', 'ROI', 'Tanggal', 'Aksi'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {getTableMessage() ? (
                                <tr><td colSpan={6} className="text-center py-4 text-gray-500">{getTableMessage()}</td></tr>
                            ) : (
                                omzetData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{formatCurrency(item.revenue)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalSales.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.adSales.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.adROI}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.createdAt?.toDate().toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">{currentItem ? 'Ubah Data Omzet' : 'Tambah Data Omzet Baru'}</h3>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="revenue" className="block text-sm font-medium text-gray-700">Omzet (IDR)</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            name="revenue"
                                            id="revenue"
                                            value={formattedValues.revenue}
                                            onChange={handleNumericInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="totalSales" className="block text-sm font-medium text-gray-700">Penjualan Total</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            name="totalSales"
                                            id="totalSales"
                                            value={formattedValues.totalSales}
                                            onChange={handleNumericInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="adSales" className="block text-sm font-medium text-gray-700">Penjualan dari Iklan</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            name="adSales"
                                            id="adSales"
                                            value={formattedValues.adSales}
                                            onChange={handleNumericInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="adROI" className="block text-sm font-medium text-gray-700">Hasil ROI</label>
                                        <input
                                            type="number"
                                            name="adROI"
                                            id="adROI"
                                            step="0.01"
                                            value={formData.adROI}
                                            onChange={handleDecimalInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700">Tanggal</label>
                                        <input
                                            type="date"
                                            name="tanggal"
                                            id="tanggal"
                                            value={formData.tanggal}
                                            onChange={handleDateChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                                <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-accent text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                                    Simpan
                                </button>
                                <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManagement;