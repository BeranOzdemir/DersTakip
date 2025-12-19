import React, { useState } from 'react';
import { useInstitution } from '../contexts/InstitutionContext';
import { Book, FileText, Link as LinkIcon, Plus, Trash2, CheckCircle, ExternalLink, MoreVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Resources({ showToast }) {
    const { resources, students, setResources } = useInstitution();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [filterType, setFilterType] = useState('all'); // all, book, pdf, link

    // Add Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState('book'); // book, pdf, link
    const [url, setUrl] = useState('');
    const [studentId, setStudentId] = useState('');

    const handleAddResource = () => {
        if (!title) {
            showToast('Lütfen bir başlık girin.', 'error');
            return;
        }

        const newResource = {
            id: uuidv4(),
            title,
            type,
            url,
            studentId: studentId || null,
            date: new Date().toISOString(),
            status: 'active' // active, completed
        };

        setResources(prev => [newResource, ...prev]);
        showToast('Kaynak eklendi!');
        setIsAddModalOpen(false);

        // Reset Form
        setTitle('');
        setType('book');
        setUrl('');
        setStudentId('');
    };

    const handleDelete = (id) => {
        if (window.confirm('Bu kaynağı silmek istediğinize emin misiniz?')) {
            setResources(prev => prev.filter(r => r.id !== id));
            showToast('Kaynak silindi.');
        }
    };

    const handleToggleStatus = (id) => {
        setResources(prev => prev.map(r => {
            if (r.id === id) {
                return { ...r, status: r.status === 'active' ? 'completed' : 'active' };
            }
            return r;
        }));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'book': return <Book size={20} className="text-orange-500" />;
            case 'pdf': return <FileText size={20} className="text-red-500" />;
            case 'link': return <LinkIcon size={20} className="text-blue-500" />;
            default: return <Book size={20} className="text-gray-500" />;
        }
    };

    const getStudentName = (id) => {
        const student = students.find(s => s.id === id);
        return student ? student.name : 'Genel';
    };

    const filteredResources = resources.filter(r => {
        if (filterType === 'all') return true;
        return r.type === filterType;
    });

    return (
        <div className="pb-32 animate-fade-in relative min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kaynaklar</h1>
                    <p className="text-gray-500 text-sm">Materyal ve ödev takibi</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-ios-blue text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 px-2 no-scrollbar">
                {[
                    { id: 'all', label: 'Tümü' },
                    { id: 'book', label: 'Kitaplar' },
                    { id: 'pdf', label: 'PDF' },
                    { id: 'link', label: 'Linkler' }
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilterType(f.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === f.id
                            ? 'bg-ios-blue text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-100'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-3 px-2">
                {filteredResources.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="mb-3">📚</div>
                        Henüz kaynak eklenmemiş.
                    </div>
                ) : (
                    filteredResources.map(resource => (
                        <div key={resource.id} className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all ${resource.status === 'completed' ? 'opacity-60 bg-gray-50' : ''}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-50 flex-shrink-0`}>
                                {getIcon(resource.type)}
                            </div>

                            <div className="flex-1 min-w-0" onClick={() => resource.url && window.open(resource.url, '_blank')}>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className={`font-semibold text-gray-900 truncate ${resource.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                                        {resource.title}
                                    </h3>
                                    {resource.url && <ExternalLink size={12} className="text-gray-400" />}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600 font-medium">
                                        {getStudentName(resource.studentId)}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(resource.date).toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleStatus(resource.id)}
                                    className={`p-2 rounded-full transition-colors ${resource.status === 'completed'
                                        ? 'text-green-500 bg-green-50'
                                        : 'text-gray-300 hover:text-green-500 hover:bg-green-50'
                                        }`}
                                >
                                    <CheckCircle size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(resource.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:p-4">
                    <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Yeni Kaynak Ekle</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                Vazgeç
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Fonksiyonlar Fasikülü"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/20 focus:border-ios-blue transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {['book', 'pdf', 'link'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`py-2 px-2 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-1 ${type === t
                                            ? 'border-ios-blue bg-blue-50 text-ios-blue'
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {getIcon(t)}
                                        <span className="capitalize">{t === 'book' ? 'Kitap' : t}</span>
                                    </button>
                                ))}
                            </div>

                            {type !== 'book' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/20 focus:border-ios-blue transition-all"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci (Opsiyonel)</label>
                                <select
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/20 focus:border-ios-blue transition-all appearance-none"
                                >
                                    <option value="">Genel (Herkes İçin)</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleAddResource}
                                className="w-full bg-ios-blue text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all mt-4"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
