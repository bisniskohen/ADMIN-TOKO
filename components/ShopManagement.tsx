import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Shop, NewShop, Admin } from '../types';

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

const ShopManagement: React.FC = () => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Shop | null>(null);
    const [formData, setFormData] = useState<NewShop>({
        shopName: '',
        adminId: ''
    });

    const adminMap = useMemo(() => {
        return admins.reduce((acc, admin) => {
            acc[admin.id] = admin.adminName;
            return acc;
        }, {} as Record<string, string>);
    }, [admins]);
    
    useEffect(() => {
        const qShops = query(collection(db, "TOKO"), orderBy("createdAt", "desc"));
        const unsubscribeShops = onSnapshot(qShops, (querySnapshot) => {
            const data: Shop[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Shop);
            });
            setShops(data);
            setLoading(false);
        });

        const qAdmins = query(collection(db, "ADMIN"), orderBy("adminName", "asc"));
        const unsubscribeAdmins = onSnapshot(qAdmins, (querySnapshot) => {
            const data: Admin[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Admin);
            });
            setAdmins(data);
        });

        return () => {
            unsubscribeShops();
            unsubscribeAdmins();
        };
    }, []);
    
    const openModal = (item: Shop | null = null) => {
        setCurrentItem(item);
        setFormData(item ? { shopName: item.shopName, adminId: item.adminId } : { shopName: '', adminId: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.adminId) {
            alert("Silakan pilih seorang admin.");
            return;
        }
        if (currentItem) {
            await updateDoc(doc(db, "TOKO", currentItem.id), { ...formData });
        } else {
            await addDoc(collection(db, "TOKO"), { ...formData, createdAt: serverTimestamp() });
        }
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus toko ini? Data penjualan terkait akan tetap ada tetapi mungkin perlu dikaitkan kembali.")) {
            await deleteDoc(doc(db, "TOKO", id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Manajemen Toko</h2>
                <button 
                  onClick={() => openModal()} 
                  disabled={admins.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    <PlusIcon className="w-5 h-5"/>
                    Tambah Toko
                </button>
            </div>
            
            {admins.length === 0 && !loading && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p>Silakan <span className='font-bold'>tambahkan seorang admin</span> terlebih dahulu di halaman Manajemen Admin sebelum menambahkan toko baru.</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Nama Toko', 'Nama Admin', 'Tanggal Dibuat', 'Aksi'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-4">Memuat data...</td></tr>
                            ) : shops.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-4 text-gray-500">Tidak ada data toko.</td></tr>
                            ) : (
                                shops.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.shopName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{adminMap[item.adminId] || 'Tidak Diketahui'}</td>
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
                                <h3 className="text-lg font-medium leading-6 text-gray-900">{currentItem ? 'Ubah Data Toko' : 'Tambah Toko Baru'}</h3>
                                <div className="mt-4 grid grid-cols-1 gap-4">
                                    <div>
                                        <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">Nama Toko</label>
                                        <input
                                            type="text"
                                            name="shopName"
                                            id="shopName"
                                            value={formData.shopName}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="adminId" className="block text-sm font-medium text-gray-700">Admin</label>
                                        <select
                                            name="adminId"
                                            id="adminId"
                                            value={formData.adminId}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        >
                                            <option value="">-- Pilih Admin --</option>
                                            {admins.map(admin => <option key={admin.id} value={admin.id}>{admin.adminName}</option>)}
                                        </select>
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

export default ShopManagement;