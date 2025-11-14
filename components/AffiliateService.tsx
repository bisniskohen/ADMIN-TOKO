import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { AffiliateEvent, NewAffiliateEvent } from '../types';

// Icons (copy from other components)
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
const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const initialFormData = {
    topic: '',
    eventType: 'Webinar/Zoom' as 'Webinar/Zoom' | 'Seminar' | 'Kopdar' | 'Private',
    eventDate: new Date().toISOString().split('T')[0]
};

const AffiliateService: React.FC = () => {
    const [events, setEvents] = useState<AffiliateEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<AffiliateEvent | null>(null);
    const [cancellingItem, setCancellingItem] = useState<AffiliateEvent | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

    useEffect(() => {
        const q = query(collection(db, "AFFILIATE_EVENTS"), orderBy("eventDate", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: AffiliateEvent[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as AffiliateEvent);
            });
            setEvents(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredEvents = useMemo(() => {
        if (eventTypeFilter === 'all') {
            return events;
        }
        return events.filter(event => event.eventType === eventTypeFilter);
    }, [events, eventTypeFilter]);
    
    const openModal = (item: AffiliateEvent | null = null) => {
        setCurrentItem(item);
        if (item) {
            setFormData({
                topic: item.topic,
                eventType: item.eventType,
                eventDate: item.eventDate.toDate().toISOString().split('T')[0],
            });
        } else {
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const openCancelModal = (item: AffiliateEvent) => {
        setCancellingItem(item);
        setIsCancelModalOpen(true);
    };

    const closeCancelModal = () => {
        setIsCancelModalOpen(false);
        setCancellingItem(null);
        setCancellationReason('');
        setRescheduleDate('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const { eventDate, ...restOfData } = formData;
        const eventDateTimestamp = Timestamp.fromDate(new Date(eventDate + 'T00:00:00'));
        
        if (currentItem) {
            await updateDoc(doc(db, "AFFILIATE_EVENTS", currentItem.id), {
                ...restOfData,
                eventDate: eventDateTimestamp,
            });
        } else {
            const dataToSave: NewAffiliateEvent = {
                ...restOfData,
                eventType: formData.eventType,
                eventDate: eventDateTimestamp,
                status: 'scheduled',
            };
            await addDoc(collection(db, "AFFILIATE_EVENTS"), { ...dataToSave, createdAt: serverTimestamp() });
        }
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) {
            await deleteDoc(doc(db, "AFFILIATE_EVENTS", id));
        }
    };
    
    const handleMarkComplete = async (id: string) => {
        await updateDoc(doc(db, "AFFILIATE_EVENTS", id), { status: 'completed' });
    };
    
    const handleConfirmCancellation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancellingItem || !cancellationReason.trim()) {
            alert("Alasan pembatalan tidak boleh kosong.");
            return;
        }

        const updateData: {
            status: 'cancelled';
            cancellationReason: string;
            eventDate?: Timestamp;
        } = {
            status: 'cancelled',
            cancellationReason: cancellationReason.trim(),
        };

        if (rescheduleDate) {
            updateData.eventDate = Timestamp.fromDate(new Date(rescheduleDate + 'T00:00:00'));
        }
        
        await updateDoc(doc(db, "AFFILIATE_EVENTS", cancellingItem.id), updateData);
        closeCancelModal();
    };

    const statusStyles: { [key: string]: string } = {
        scheduled: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
    };
     const statusText: { [key: string]: string } = {
        scheduled: 'Terjadwal',
        completed: 'Terlaksana',
        cancelled: 'Dibatalkan',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Affiliate Service</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        name="eventTypeFilter"
                        id="eventTypeFilter"
                        value={eventTypeFilter}
                        onChange={(e) => setEventTypeFilter(e.target.value)}
                        className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    >
                        <option value="all">Semua Jenis Kegiatan</option>
                        <option value="Webinar/Zoom">Webinar/Zoom</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Kopdar">Kopdar</option>
                        <option value="Private">Private</option>
                    </select>
                    <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
                        <PlusIcon className="w-5 h-5"/>
                        Tambah Kegiatan
                    </button>
                </div>
            </div>
            
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md flex items-start" role="alert">
                <InfoIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                <div>
                    <p className="font-bold">Notifikasi</p>
                    <p>Halaman ini digunakan untuk mengelola semua kegiatan yang berhubungan dengan afiliasi, seperti webinar, seminar, dan lainnya.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Tema Pembahasan', 'Jenis Kegiatan', 'Tanggal Dilaksanakan', 'Status', 'Keterangan', 'Aksi'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-4">Memuat data...</td></tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-4 text-gray-500">Tidak ada kegiatan yang cocok dengan filter.</td></tr>
                            ) : (
                                filteredEvents.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.topic}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.eventType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.eventDate?.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[item.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {statusText[item.status] || 'Tidak Diketahui'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-500 max-w-xs">{item.cancellationReason || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {item.status === 'scheduled' && (
                                                <>
                                                    <button onClick={() => handleMarkComplete(item.id)} className="text-green-600 hover:text-green-900" title="Tandai Terlaksana"><CheckIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => openCancelModal(item)} className="text-yellow-600 hover:text-yellow-900" title="Batalkan"><XIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900" title="Ubah"><PencilIcon className="w-5 h-5"/></button>
                                                </>
                                            )}
                                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="Hapus"><TrashIcon className="w-5 h-5"/></button>
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
                                <h3 className="text-lg font-medium leading-6 text-gray-900">{currentItem ? 'Ubah Data Kegiatan' : 'Tambah Kegiatan Baru'}</h3>
                                <div className="mt-4 grid grid-cols-1 gap-4">
                                    <div>
                                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Tema Pembahasan</label>
                                        <input
                                            type="text"
                                            name="topic"
                                            id="topic"
                                            value={formData.topic}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">Jenis Kegiatan</label>
                                        <select
                                            name="eventType"
                                            id="eventType"
                                            value={formData.eventType}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        >
                                            <option value="Webinar/Zoom">Webinar/Zoom</option>
                                            <option value="Seminar">Seminar</option>
                                            <option value="Kopdar">Kopdar</option>
                                            <option value="Private">Private</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">Tanggal Dilaksanakan</label>
                                        <input
                                            type="date"
                                            name="eventDate"
                                            id="eventDate"
                                            value={formData.eventDate}
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
             {isCancelModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <form onSubmit={handleConfirmCancellation}>
                            <div className="p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Batalkan Kegiatan</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Anda akan membatalkan kegiatan: <span className="font-semibold">{cancellingItem?.topic}</span>
                                </p>
                                <div className="mt-4 grid grid-cols-1 gap-4">
                                    <div>
                                        <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700">Alasan Pembatalan <span className="text-red-500">*</span></label>
                                        <textarea
                                            name="cancellationReason"
                                            id="cancellationReason"
                                            rows={3}
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label htmlFor="rescheduleDate" className="block text-sm font-medium text-gray-700">Pindahkan Tanggal (Opsional)</label>
                                        <input
                                            type="date"
                                            name="rescheduleDate"
                                            id="rescheduleDate"
                                            value={rescheduleDate}
                                            onChange={(e) => setRescheduleDate(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                                <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                                    Konfirmasi Pembatalan
                                </button>
                                <button type="button" onClick={closeCancelModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
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

export default AffiliateService;