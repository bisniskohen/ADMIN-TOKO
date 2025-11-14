import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { CreatorSample, Creator } from '../types';

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
const BoxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>
);

const initialFormData = {
    creatorId: '',
    recipientName: '',
    address: '',
    phoneNumber: '',
    quantity: 1,
    dateSent: new Date().toISOString().split('T')[0]
};


const CreatorSamples: React.FC = () => {
    const [samples, setSamples] = useState<CreatorSample[]>([]);
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<CreatorSample | null>(null);
    const [formData, setFormData] = useState({ ...initialFormData });
    const [selectedCreatorIdFilter, setSelectedCreatorIdFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState<string>(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);

    const creatorMap = useMemo(() => {
        return creators.reduce((acc, creator) => {
            acc[creator.id] = creator.name;
            return acc;
        }, {} as Record<string, string>);
    }, [creators]);

    const filteredSamples = useMemo(() => {
        return samples.filter(sample => {
            const creatorName = creatorMap[sample.creatorId] || '';
            const searchMatch = searchQuery ? creatorName.toLowerCase().includes(searchQuery.toLowerCase()) : true;
            
            const creatorMatch = selectedCreatorIdFilter === 'all' || sample.creatorId === selectedCreatorIdFilter;
            
            let dateMatch = true;
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                const sampleDate = sample.dateSent.toDate();
                dateMatch = sampleDate >= start && sampleDate <= end;
            }

            return creatorMatch && dateMatch && searchMatch;
        });
    }, [samples, creatorMap, selectedCreatorIdFilter, startDate, endDate, searchQuery]);
    
    const totalSamplesSent = useMemo(() => {
        return filteredSamples.reduce((total, sample) => total + (sample.quantity || 0), 0);
    }, [filteredSamples]);

    useEffect(() => {
        const qSamples = query(collection(db, "CREATOR_SAMPLES"), orderBy("createdAt", "desc"));
        const unsubscribeSamples = onSnapshot(qSamples, (querySnapshot) => {
            const data: CreatorSample[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as CreatorSample);
            });
            setSamples(data);
            setLoading(false);
        });

        const qCreators = query(collection(db, "CREATORS"), orderBy("name", "asc"));
        const unsubscribeCreators = onSnapshot(qCreators, (querySnapshot) => {
            const data: Creator[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Creator);
            });
            setCreators(data);
        });

        return () => {
            unsubscribeSamples();
            unsubscribeCreators();
        };
    }, []);

    useEffect(() => {
      // Auto-fill form for new samples when a creator is selected
      if (!isModalOpen || currentItem || !formData.creatorId) return;

      const selectedCreator = creators.find(c => c.id === formData.creatorId);
      if (selectedCreator) {
        setFormData(prev => ({
          ...prev,
          recipientName: selectedCreator.recipientName || '',
          address: selectedCreator.address || '',
          phoneNumber: selectedCreator.phoneNumber || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          recipientName: '',
          address: '',
          phoneNumber: ''
        }));
      }
    }, [formData.creatorId, creators, isModalOpen, currentItem]);
    
    const openModal = (item: CreatorSample | null = null) => {
        setCurrentItem(item);
        if (item) {
             setFormData({
                creatorId: item.creatorId,
                recipientName: item.recipientName,
                address: item.address,
                phoneNumber: item.phoneNumber || '',
                quantity: item.quantity,
                dateSent: item.dateSent.toDate().toISOString().split('T')[0]
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
        if (!formData.creatorId) {
            alert("Silakan pilih seorang kreator.");
            return;
        }

        const { dateSent, creatorId, recipientName, address, quantity, phoneNumber } = formData;
        const dateSentTimestamp = Timestamp.fromDate(new Date(dateSent + 'T00:00:00'));

        const dataToSave = {
            creatorId,
            recipientName,
            address,
            phoneNumber: phoneNumber || '',
            quantity: Number(quantity),
            dateSent: dateSentTimestamp
        };

        if (currentItem) {
            await updateDoc(doc(db, "CREATOR_SAMPLES", currentItem.id), dataToSave);
        } else {
            await addDoc(collection(db, "CREATOR_SAMPLES"), { ...dataToSave, createdAt: serverTimestamp() });
        }
        
        // Update creator's default info for future auto-fill
        const creatorRef = doc(db, "CREATORS", creatorId);
        const selectedCreator = creators.find(c => c.id === creatorId);
        
        const creatorUpdatePayload: { 
            recipientName: string; 
            address: string;
            phoneNumber?: string; 
        } = {
            recipientName,
            address,
        };
        
        // If a phone number was provided for a TikTok-sourced creator, update their profile
        if (phoneNumber && selectedCreator?.source === 'TikTok') {
            creatorUpdatePayload.phoneNumber = phoneNumber;
        }

        await updateDoc(creatorRef, creatorUpdatePayload);


        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data sampel ini?")) {
            await deleteDoc(doc(db, "CREATOR_SAMPLES", id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Sampel Kreator</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        placeholder="Cari nama kreator..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    />
                    <select
                        value={selectedCreatorIdFilter}
                        onChange={(e) => setSelectedCreatorIdFilter(e.target.value)}
                        className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    >
                        <option value="all">Semua Kreator</option>
                        {creators.map(creator => (
                            <option key={creator.id} value={creator.id}>{creator.name}</option>
                        ))}
                    </select>
                     <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    />
                    <button 
                      onClick={() => openModal()} 
                      disabled={creators.length === 0}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                        <PlusIcon className="w-5 h-5"/>
                        Tambah
                    </button>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between w-full md:w-1/3">
                <div>
                    <p className="text-sm font-medium text-gray-500">Total Sampel Terkirim</p>
                    <p className="text-2xl font-bold text-gray-800">{totalSamplesSent.toLocaleString('id-ID')} Botol</p>
                </div>
                <div className="bg-accent/10 p-3 rounded-full text-accent">
                    <BoxIcon className="h-6 w-6"/>
                </div>
            </div>

            {creators.length === 0 && !loading && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p>Silakan <span className='font-bold'>tambahkan seorang kreator</span> terlebih dahulu di halaman Hubungi Kreator sebelum menambahkan data sampel.</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Nama Kreator', 'Nama Penerima', 'Alamat', 'Nomor Telepon', 'Tanggal Kirim', 'Jumlah', 'Aksi'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-4">Memuat data...</td></tr>
                            ) : filteredSamples.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-4 text-gray-500">{searchQuery ? 'Tidak ada hasil yang cocok dengan pencarian Anda.' : 'Tidak ada data sampel untuk filter yang dipilih.'}</td></tr>
                            ) : (
                                filteredSamples.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{creatorMap[item.creatorId] || 'Tidak Diketahui'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.recipientName}</td>
                                        <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-500 max-w-xs">{item.address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phoneNumber || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dateSent?.toDate().toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} Botol</td>
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
                                <h3 className="text-lg font-medium leading-6 text-gray-900">{currentItem ? 'Ubah Data Sampel' : 'Tambah Data Sampel Baru'}</h3>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div className="sm:col-span-2">
                                        <label htmlFor="creatorId" className="block text-sm font-medium text-gray-700">Nama Akun Kreator</label>
                                        <select
                                            name="creatorId"
                                            id="creatorId"
                                            value={formData.creatorId}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        >
                                            <option value="">-- Pilih Kreator --</option>
                                            {creators.map(creator => <option key={creator.id} value={creator.id}>{creator.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700">Nama Penerima</label>
                                        <input
                                            type="text" name="recipientName" id="recipientName" value={formData.recipientName} onChange={handleInputChange} required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat</label>
                                        <textarea
                                            name="address" id="address" value={formData.address} onChange={handleInputChange} required rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                     <div className="sm:col-span-2">
                                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
                                        <input
                                            type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                            placeholder="Nomor HP untuk pengiriman (opsional)"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="dateSent" className="block text-sm font-medium text-gray-700">Tanggal Kirim</label>
                                        <input
                                            type="date" name="dateSent" id="dateSent" value={formData.dateSent} onChange={handleInputChange} required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Jumlah (Botol)</label>
                                        <select
                                            name="quantity" id="quantity" value={formData.quantity} onChange={handleInputChange} required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        >
                                           {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
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

export default CreatorSamples;