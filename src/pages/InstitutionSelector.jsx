import React, { useState } from 'react';
import { Plus, ChevronRight, Wallet, Camera } from 'lucide-react';
import PhotoCropper from '../components/ui/PhotoCropper';
import { useAuth } from '../contexts/AuthContext';
import { useInstitution } from '../contexts/InstitutionContext';

export default function InstitutionSelector({ showToast, onResetGlobalSafe, onWithdrawFromGlobalSafe }) {
    const { user, globalCash, globalTransactions } = useAuth();
    const { institutions, switchInstitution: onSelectInstitution, addInstitution: onAddInstitution } = useInstitution();

    const totalStudents = institutions.reduce((acc, inst) => acc + (inst.students?.length || 0), 0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // Global Safe History Modal
    const [newInstName, setNewInstName] = useState('');
    const [newInstPhoto, setNewInstPhoto] = useState(null);

    const [cropImageSrc, setCropImageSrc] = useState(null); // For Cropper

    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    // Calculate Lifetime Total and Legacy Balance
    const historyNet = (globalTransactions || []).reduce((acc, tx) => acc + tx.amount, 0);
    const legacyBalance = Math.max(0, (globalCash || 0) - historyNet);

    // Lifetime is Sum of all POSITIVE transfers + legacy balance
    const lifetimeTotal = (globalTransactions || [])
        .filter(tx => tx.amount > 0) // Only count money IN
        .reduce((acc, tx) => acc + tx.amount, 0) + legacyBalance;

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropImageSrc(reader.result); // Start Cropping
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdd = () => {
        if (!newInstName) return;
        onAddInstitution(newInstName, newInstPhoto);
        setIsAddModalOpen(false);
        setNewInstName('');
        setNewInstPhoto(null);
    };

    return (
        <div className="bg-ios-bg min-h-screen pt-12 pb-20 px-4 animate-fade-in relative z-0">
            {/* Header */}
            <div className="flex flex-col items-center mb-10">
                <div className="w-24 h-24 rounded-full bg-white shadow-lg overflow-hidden mb-4 border-4 border-white">
                    {user?.photo ? (
                        <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center text-3xl font-bold text-white ${user?.avatarColor || 'bg-gray-300'}`}>
                            {user?.name?.charAt(0)}
                        </div>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Merhaba, {user?.name.split(' ')[0]} 👋</h1>
                <p className="text-ios-subtext mt-1">
                    Toplam {institutions.length} Kurum • {totalStudents} Öğrenci
                </p>
            </div>

            {/* Global Safe Card */}
            <div
                onClick={() => setIsHistoryModalOpen(true)}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg shadow-gray-400/20 mb-8 transform transition-transform active:scale-[0.98] cursor-pointer"
            >
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-gray-400 font-medium mb-1">Genel Kasa</h2>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold tracking-tight">{globalCash?.toLocaleString()}</span>
                            <span className="text-2xl font-medium text-gray-400">₺</span>
                        </div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <Wallet className="text-white opacity-80" size={24} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 py-2 px-3 rounded-lg w-fit">
                    <span>Toplam Toplanan:</span>
                    <span className="text-white font-semibold">{lifetimeTotal.toLocaleString()}₺</span>
                </div>
            </div>

            {/* Institutions List */}
            <h2 className="text-xl font-bold px-1 mb-4">Kurumlarınız</h2>

            <div className="space-y-3">
                {institutions.map(inst => (
                    <button
                        key={inst.id}
                        onClick={() => onSelectInstitution(inst.id)}
                        className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400 overflow-hidden">
                                {inst.photo ? (
                                    <img src={inst.photo} alt={inst.name} className="w-full h-full object-cover" />
                                ) : (
                                    inst.name.charAt(0)
                                )}
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-ios-blue transition-colors">{inst.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {inst.students?.length || 0} Öğrenci • {(inst.students || []).reduce((acc, s) => acc + (s.balance < 0 ? Math.abs(s.balance) : 0), 0).toLocaleString()}₺ Alacak
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="font-bold text-gray-900">{inst.cash || 0}₺</div>
                                <div className="text-xs text-gray-400">Kasa</div>
                            </div>
                            <ChevronRight className="text-gray-300 group-hover:text-ios-blue transition-colors" />
                        </div>
                    </button>
                ))}

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full bg-blue-50/50 p-4 rounded-xl border-2 border-dashed border-blue-100 flex items-center justify-center gap-2 text-ios-blue font-semibold active:bg-blue-50 transition-colors"
                >
                    <Plus size={20} />
                    Yeni Kurum Ekle
                </button>
            </div>

            {/* Add Institution Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-[320px] rounded-2xl p-6 shadow-2xl animate-scale-in relative z-10">
                        <h3 className="text-xl font-bold text-center mb-6">Yeni Kurum</h3>

                        {/* Photo Upload */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className={`w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300`}>
                                    {newInstPhoto ? (
                                        <img src={newInstPhoto} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="text-gray-400" size={32} />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handlePhotoUpload}
                                />
                                {newInstPhoto && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNewInstPhoto(null);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                                    >
                                        <div className="w-3 h-3 flex items-center justify-center text-xs">✕</div>
                                    </button>
                                )}
                            </div>
                        </div>

                        <input
                            type="text"
                            className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[17px] mb-6 focus:outline-none focus:ring-2 focus:ring-ios-blue/50 transition-all placeholder:text-gray-400"
                            placeholder="Kurum Adı"
                            value={newInstName}
                            onChange={(e) => setNewInstName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold active:scale-95 transition-transform"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleAdd}
                                className="flex-1 bg-ios-blue text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-200 active:scale-95 transition-transform disabled:opacity-50"
                                disabled={!newInstName}
                            >
                                Oluştur
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={() => setIsHistoryModalOpen(false)}></div>
                    <div className="bg-white w-full sm:w-[320px] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up pointer-events-auto z-10 flex flex-col max-h-[85vh] relative">
                        {/* Confirmation Overlay within Modal */}
                        {isResetConfirmOpen && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur z-20 flex flex-col items-center justify-center p-6 rounded-2xl animate-fade-in text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-ios-red">
                                    <Wallet size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Kasayı Sıfırla?</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Kasada bulunan <strong>{globalCash?.toLocaleString()}₺</strong> tutarındaki bakiye çekilecek ve kasa sıfırlanacaktır.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setIsResetConfirmOpen(false)}
                                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={() => {
                                            onResetGlobalSafe();
                                            setIsResetConfirmOpen(false);
                                            setIsHistoryModalOpen(false);
                                        }}
                                        className="flex-1 bg-ios-red text-white py-3 rounded-xl font-semibold shadow-lg shadow-red-200 active:scale-95 transition-transform"
                                    >
                                        Sıfırla
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Withdraw Modal Overlay inside History Modal */}
                        {isWithdrawModalOpen && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur z-20 flex flex-col items-center justify-center p-6 rounded-2xl animate-fade-in">
                                <h3 className="text-xl font-bold mb-2">Para Çek</h3>
                                <p className="text-gray-500 text-sm mb-6">Ne kadar çekmek istiyorsunuz?</p>

                                <div className="mb-6 w-full">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₺</span>
                                        <input
                                            type="number"
                                            autoFocus
                                            className="w-full bg-gray-100 rounded-xl py-3 pl-8 pr-4 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ios-blue/50 transition-all text-black"
                                            placeholder="0"
                                            id="globalWithdrawInput"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-center">Mevcut: {globalCash?.toLocaleString()}₺</p>
                                </div>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setIsWithdrawModalOpen(false)}
                                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={() => {
                                            const val = document.getElementById('globalWithdrawInput').value;
                                            if (val && onWithdrawFromGlobalSafe) {
                                                onWithdrawFromGlobalSafe(parseInt(val, 10));
                                                setIsWithdrawModalOpen(false);
                                                // setIsHistoryModalOpen(false); // Can keep open to see updated balance
                                            }
                                        }}
                                        className="flex-1 bg-ios-blue text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                                    >
                                        Onayla
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Modal Header */}
                        <div className="p-6 pb-2 border-b border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold">Kasa Hareketleri</h3>
                                <button onClick={() => setIsHistoryModalOpen(false)} className="bg-gray-100 rounded-full p-1 text-gray-500"><div className="w-6 h-6 flex justify-center items-center">✕</div></button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl mb-2">
                                <span className="text-xs uppercase text-ios-subtext font-semibold block mb-1">Şimdiye Kadar Biriken</span>
                                <span className="text-2xl font-bold text-gray-800">{lifetimeTotal.toLocaleString()}₺</span>

                                {/* Institution Breakdown */}
                                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                                    {(globalTransactions || [])
                                        .filter(tx => tx.type === 'transfer_in')
                                        .reduce((acc, tx) => {
                                            const existing = acc.find(i => i.name === tx.institutionName);
                                            if (existing) {
                                                existing.total += tx.amount;
                                            } else {
                                                acc.push({ name: tx.institutionName, total: tx.amount });
                                            }
                                            return acc;
                                        }, [])
                                        .sort((a, b) => b.total - a.total)
                                        .map(item => (
                                            <div key={item.name} className="flex justify-between text-sm">
                                                <span className="text-gray-500">{item.name}</span>
                                                <span className="font-medium text-gray-700">{item.total.toLocaleString()}₺</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Transaction List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Legacy Balance Item */}
                            {legacyBalance > 0 && (
                                <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 opacity-60">
                                    <div>
                                        <div className="font-semibold text-[15px]">Devir Bakiyesi</div>
                                        <div className="text-xs text-ios-subtext">Geçmiş Dönem</div>
                                    </div>
                                    <div className="font-bold text-ios-green">
                                        +{legacyBalance.toLocaleString()}₺
                                    </div>
                                </div>
                            )}

                            {globalTransactions && globalTransactions.length > 0 ? (
                                <div className="space-y-1">
                                    {globalTransactions.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                            <div>
                                                <div className="font-semibold text-[15px]">{tx.institutionName}</div>
                                                <div className="text-xs text-ios-subtext">{tx.date} • {tx.time}</div>
                                            </div>
                                            <div className={`font-bold ${tx.amount < 0 ? 'text-ios-red' : 'text-ios-green'}`}>
                                                {tx.amount < 0 ? '' : '+'}{tx.amount.toLocaleString()}₺
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : !legacyBalance && (
                                <div className="text-center text-gray-400 py-10">
                                    Henüz işlem yok.
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-4 border-t border-gray-100 flex gap-3">
                            {/* Partial Withdraw Button */}
                            <button
                                onClick={() => setIsWithdrawModalOpen(true)}
                                disabled={globalCash <= 0}
                                className="flex-1 bg-ios-blue text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-200 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
                            >
                                Para Çek
                            </button>

                            {/* Reset Button */}
                            <button
                                onClick={() => setIsResetConfirmOpen(true)}
                                disabled={globalCash <= 0}
                                className="flex-1 bg-ios-red/10 text-ios-red py-3.5 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
                            >
                                Sıfırla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Cropper Overlay */}
            {cropImageSrc && (
                <PhotoCropper
                    imageSrc={cropImageSrc}
                    onCancel={() => setCropImageSrc(null)}
                    onCropComplete={(base64) => {
                        setNewInstPhoto(base64);
                        setCropImageSrc(null);
                    }}
                />
            )}
        </div>
    );
}
