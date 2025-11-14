import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, Timestamp, writeBatch } from 'firebase/firestore';
import { Creator } from '../types';

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

const initialFormData = {
    name: '',
    phoneNumber: '',
    source: 'TikTok' as 'TikTok' | 'WA',
    dateContacted: new Date().toISOString().split('T')[0]
};

const CreatorHub: React.FC = () => {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Creator | null>(null);
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        const q = query(collection(db, "CREATORS"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: Creator[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Creator);
            });
            setCreators(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const openModal = (item: Creator | null = null) => {
        setCurrentItem(item);
        if (item) {
            setFormData({
                name: item.name,
                source: item.source,
                dateContacted: item.dateContacted.toDate().toISOString().split('T')[0],
                phoneNumber: item.phoneNumber || '',
            });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const { dateContacted, source, name, phoneNumber } = formData;
        const dateContactedTimestamp = Timestamp.fromDate(new Date(dateContacted + 'T00:00:00'));

        if (currentItem) {
            // Update single existing creator
            const dataToUpdate = {
                name,
                source,
                dateContacted: dateContactedTimestamp,
                phoneNumber: source === 'WA' ? phoneNumber : ''
            };
            await updateDoc(doc(db, "CREATORS", currentItem.id), dataToUpdate);
        } else {
            // Add multiple new creators
            const names = name.split('\n').map(n => n.trim()).filter(n => n);
            const phoneNumbers = source === 'WA' ? (phoneNumber || '').split('\n').map(p => p.trim()) : [];

            if (names.length === 0) {
                alert("Silakan masukkan setidaknya satu nama kreator.");
                return;
            }
            const batch = writeBatch(db);
            names.forEach((creatorName, index) => {
                const newCreatorRef = doc(collection(db, "CREATORS"));
                batch.set(newCreatorRef, { 
                    name: creatorName,
                    source: source,
                    dateContacted: dateContactedTimestamp,
                    createdAt: serverTimestamp(),
                    phoneNumber: source === 'WA' && phoneNumbers[index] ? phoneNumbers[index] : ''
                });
            });
            await batch.commit();
        }
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus kreator ini?")) {
            await deleteDoc(doc(db, "CREATORS", id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Hubungi Kreator</h2>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
                    <PlusIcon className="w-5 h-5"/>
                    Tambah Kreator
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Nama Kreator', 'Nomor HP', 'Sumber Dihubungi', 'Tanggal Dihubungi', 'Tanggal Dibuat', 'Aksi'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-4">Memuat data...</td></tr>
                            ) : creators.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-4 text-gray-500">Tidak ada data kreator.</td></tr>
                            ) : (
                                creators.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phoneNumber || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.source}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dateContacted?.toDate().toLocaleDateString('id-ID')}</td>
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
                                <h3 className="text-lg font-medium leading-6 text-gray-900">{currentItem ? 'Ubah Data Kreator' : 'Tambah Kreator Baru'}</h3>
                                <div className="mt-4 grid grid-cols-1 gap-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Kreator</label>
                                        {currentItem ? (
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                            />
                                        ) : (
                                            <textarea
                                                name="name"
                                                id="name"
                                                rows={4}
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                                placeholder="Masukkan satu nama per baris untuk menambah banyak kreator sekaligus."
                                            ></textarea>
                                        )}
                                    </div>
                                     <div>
                                        <label htmlFor="source" className="block text-sm font-medium text-gray-700">Sumber Dihubungi</label>
                                        <select
                                            name="source"
                                            id="source"
                                            value={formData.source}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        >
                                            <option value="TikTok">TikTok</option>
                                            <option value="WA">WA</option>
                                        </select>
                                    </div>
                                    {formData.source === 'WA' && (
                                        <div>
                                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Nomor HP</label>
                                            {currentItem ? (
                                                <input
                                                    type="text"
                                                    name="phoneNumber"
                                                    id="phoneNumber"
                                                    value={formData.phoneNumber}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                                    placeholder="Contoh: 081234567890"
                                                />
                                            ) : (
                                                <textarea
                                                    name="phoneNumber"
                                                    id="phoneNumber"
                                                    rows={4}
                                                    value={formData.phoneNumber}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                                    placeholder="Satu nomor per baris, sesuaikan urutan dengan nama."
                                                ></textarea>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <label htmlFor="dateContacted" className="block text-sm font-medium text-gray-700">Tanggal Dihubungi</label>
                                        <input
                                            type="date"
                                            name="dateContacted"
                                            id="dateContacted"
                                            value={formData.dateContacted}
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

export default CreatorHub;