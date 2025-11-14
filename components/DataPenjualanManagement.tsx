import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp, where } from 'firebase/firestore';
import { DataPenjualan, Admin, Shop } from '../types';

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
    namaProduk: '',
    jumlah: 0,
    harga: 0,
    tanggal: new Date().toISOString().split('T')[0]
};

const DataPenjualanManagement: React.FC = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [dataPenjualan, setDataPenjualan] = useState<DataPenjualan[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<DataPenjualan | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [formattedHarga, setFormattedHarga] = useState('0');

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
            setDataPenjualan([]);
            setLoadingData(false);
            return;
        }

        setLoadingData(true);
        const q = query(collection(db, "DATA PENJUALAN"), where("shopId", "==", selectedShopId));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: DataPenjualan[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as DataPenjualan);
            });
            data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setDataPenjualan(data);
            setLoadingData(false);
        }, (error) => {
            console.error("Error fetching sales data:", error);
            setLoadingData(false);
        });
        return () => unsubscribe();
    }, [selectedShopId]);
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    const openModal = (item: DataPenjualan | null = null) => {
        setCurrentItem(item);
        if (item) {
            setFormData({
                namaProduk: item.namaProduk,
                jumlah: item.jumlah,
                harga: item.harga,
                tanggal: item.createdAt.toDate().toISOString().split('T')[0]
            });
            setFormattedHarga(new Intl.NumberFormat('id-ID').format(item.harga));
        } else {
            setFormData(initialFormState);
            setFormattedHarga('0');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };
    
    const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
        
        setFormData(prev => ({ ...prev, harga: numericValue }));
        setFormattedHarga(new Intl.NumberFormat('id-ID').format(numericValue));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShopId || !selectedAdminId) {
            alert("Silakan pilih admin dan toko terlebih dahulu.");
            return;
        }
        
        const { tanggal, ...restOfFormData } = formData;
        const createdAtTimestamp = Timestamp.fromDate(new Date(tanggal + 'T00:00:00'));

        const dataToSave = { 
            ...restOfFormData, 
            createdAt: createdAtTimestamp,
            shopId: selectedShopId,
            adminId: selectedAdminId,
        };
        
        if (currentItem) {
            await updateDoc(doc(db, "DATA PENJUALAN", currentItem.id), dataToSave);
        } else {
            await addDoc(collection(db, "DATA PENJUALAN"), dataToSave);
        }
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            await deleteDoc(doc(db, "DATA PENJUALAN", id));
        }
    };
    
    const getTableMessage = () => {
        if (loadingData) return "Memuat data...";
        if (!selectedAdminId) return "Silakan pilih admin untuk memulai.";
        if (!selectedShopId) return "Silakan pilih toko untuk melihat data penjualan.";
        if (dataPenjualan.length === 0) return "Tidak ada data untuk toko ini.";
        return "";
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Manajemen Data Penjualan</h2>
                 <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
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
                                {['Nama Produk', 'Jumlah', 'Harga Satuan', 'Total Harga', 'Tanggal', 'Aksi'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {getTableMessage() ? (
                                <tr><td colSpan={6} className="text-center py-4 text-gray-500">{getTableMessage()}</td></tr>
                            ) : (
                                dataPenjualan.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.namaProduk}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.harga)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{formatCurrency(item.harga * item.jumlah)}</td>
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
                                <h3 className="text-lg font-medium leading-6 text-gray-900">{currentItem ? 'Ubah Data Penjualan' : 'Tambah Data Penjualan'}</h3>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="namaProduk" className="block text-sm font-medium text-gray-700">Nama Produk</label>
                                        <input
                                            type="text"
                                            name="namaProduk"
                                            id="namaProduk"
                                            value={formData.namaProduk}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="jumlah" className="block text-sm font-medium text-gray-700">Jumlah Terjual</label>
                                        <input
                                            type="number"
                                            name="jumlah"
                                            id="jumlah"
                                            value={formData.jumlah}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="harga" className="block text-sm font-medium text-gray-700">Harga Satuan (IDR)</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            name="harga"
                                            id="harga"
                                            value={formattedHarga}
                                            onChange={handleHargaChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700">Tanggal Transaksi</label>
                                        <input
                                            type="date"
                                            name="tanggal"
                                            id="tanggal"
                                            value={formData.tanggal}
                                            onChange={handleInputChange}
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

export default DataPenjualanManagement;