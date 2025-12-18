import React from 'react';
import { useInstitution } from '../contexts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';

export default function Stats({ showToast }) {
    const { students, lessons, activeInstitution, cash, transactions, handleTransferToGlobalSafe, updateActiveInstitution } = useInstitution();
    const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);
    const [transferAmount, setTransferAmount] = React.useState('');
    const [isCollectModalOpen, setIsCollectModalOpen] = React.useState(false);
    const [selectedDebtor, setSelectedDebtor] = React.useState(null); // If null, collect all

    // 1. Transfer Logic
    const onTransfer = () => {
        const amount = parseFloat(transferAmount);
        if (isNaN(amount) || amount <= 0) {
            showToast('Geçerli bir tutar girin', 'error');
            return;
        }
        if (amount > cash) {
            showToast('Yetersiz bakiye', 'error');
            return;
        }

        handleTransferToGlobalSafe(amount);
        showToast(`${amount}₺ genel kasaya aktarıldı`, 'success');
        setIsTransferModalOpen(false);
        setTransferAmount('');
    }

    // ... (Existing calculation logic) ...

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyLessons = lessons.filter(l => {
        const d = new Date(l.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const expectedRevenue = monthlyLessons.reduce((acc, l) => {
        const student = students.find(s => s.id === l.studentId);
        return acc + (student ? student.feePerLesson : 0);
    }, 0);

    const realizedRevenue = monthlyLessons
        .filter(l => l.status === 'completed')
        .reduce((acc, l) => {
            const student = students.find(s => s.id === l.studentId);
            return acc + (student ? student.feePerLesson : 0);
        }, 0);

    // 2. Debt Calculation
    const debtors = students
        .filter(s => s.balance < 0)
        .sort((a, b) => a.balance - b.balance); // En çok borcu olan (en küçük negatif) en üstte

    const totalDebt = debtors.reduce((acc, s) => acc + Math.abs(s.balance), 0);

    return (
        <div className="pb-20 pt-2 space-y-6">
            <h1 className="text-[34px] font-bold tracking-tight px-2">Finans</h1>

            {/* Institution Safe Card */}
            <div className="mx-2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl shadow-gray-200 overflow-hidden relative">
                <div className="absolute -right-6 -top-6 text-white/5">
                    <Wallet size={160} />
                </div>
                <div className="relative z-10">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">KURUM KASASI</div>
                    <div className="text-4xl font-bold tracking-tight mb-6">{cash}₺</div>

                    <button
                        onClick={() => setIsTransferModalOpen(true)}
                        className="bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/10 text-white pl-4 pr-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 group"
                    >
                        Genel Kasaya Aktar
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>
            </div>

            {/* Transfer Modal */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
                    <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-scale-in">
                        <h3 className="text-lg font-bold mb-1 text-center">Kasaya Aktar</h3>
                        <p className="text-center text-gray-500 text-sm mb-6">Genel cüzdanınıza ne kadar aktarmak istersiniz?</p>

                        <div className="mb-6">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₺</span>
                                <input
                                    type="number" autoFocus
                                    value={transferAmount}
                                    onChange={e => setTransferAmount(e.target.value)}
                                    className="w-full bg-gray-100 rounded-2xl py-4 pl-10 pr-4 font-bold text-2xl text-center outline-none focus:ring-2 focus:ring-gray-900/10 transition-all text-gray-900 placeholder:text-gray-300"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex justify-center mt-3">
                                <button onClick={() => setTransferAmount(cash)} className="text-xs text-ios-blue font-semibold px-3 py-1.5 bg-blue-50 rounded-lg active:scale-95 transition-transform">Tümü ({cash}₺)</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setIsTransferModalOpen(false)} className="py-3.5 text-gray-500 font-semibold bg-gray-100 rounded-xl active:scale-95 transition-transform">Vazgeç</button>
                            <button onClick={onTransfer} className="py-3.5 text-white font-semibold bg-gray-900 rounded-xl shadow-lg shadow-gray-200 active:scale-95 transition-transform">Aktar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Income Summary Cards */}
            <div className="grid grid-cols-2 gap-4 px-2">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <TrendingUp size={16} className="text-green-500" />
                        <span className="text-xs font-semibold uppercase">Beklenen Gelir</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{expectedRevenue}₺</div>
                    <div className="text-[10px] text-gray-400 mt-1">Bu ayki toplam dersler</div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Wallet size={16} className="text-ios-blue" />
                        <span className="text-xs font-semibold uppercase">Gerçekleşen</span>
                    </div>
                    <div className="text-2xl font-bold text-ios-blue">{realizedRevenue}₺</div>
                    <div className="text-[10px] text-gray-400 mt-1">Tamamlanan dersler</div>
                </div>
            </div>

            {/* Total Debt Banner with Action */}
            <div className="mx-2 bg-red-50 p-4 rounded-2xl border border-red-100 flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                        <TrendingDown size={18} />
                        <span className="font-semibold text-sm">Toplam Alacak</span>
                    </div>
                    <div className="text-3xl font-bold text-red-700">{totalDebt}₺</div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    {totalDebt > 0 && (
                        <button
                            onClick={() => { setSelectedDebtor(null); setIsCollectModalOpen(true); }}
                            className="bg-white text-red-600 border border-red-200 shadow-sm px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                        >
                            Hepsini Tahsil Et
                        </button>
                    )}
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                        <AlertCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Collect Confirm Modal */}
            {isCollectModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
                    <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-scale-in">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <Wallet size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2 text-center text-gray-900">
                            {selectedDebtor ? `${selectedDebtor.name} Tahsilat` : 'Tüm Alacakları Tahsil Et?'}
                        </h3>
                        <p className="text-center text-gray-500 text-sm mb-6">
                            {selectedDebtor
                                ? <><span className="font-bold text-gray-900">{Math.abs(selectedDebtor.balance)}₺</span> tutarındaki borç tahsil edilecek.</>
                                : <>Toplam <span className="font-bold text-gray-900">{totalDebt}₺</span> tutarındaki tüm borçlar "tahsil edildi" olarak işaretlenecek ve kasa bakiyesine eklenecek.</>
                            }
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setIsCollectModalOpen(false)} className="py-3.5 text-gray-500 font-semibold bg-gray-100 rounded-xl active:scale-95 transition-transform">Vazgeç</button>
                            <button
                                onClick={() => {
                                    const now = new Date();
                                    const date = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                                    const time = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                                    let totalCollected = 0;
                                    const newTxList = [];

                                    const updatedStudents = students.map(s => {
                                        // Collect Single
                                        if (selectedDebtor) {
                                            if (s.id === selectedDebtor.id) {
                                                const amount = Math.abs(s.balance);
                                                totalCollected += amount;
                                                // Tx ID
                                                const txId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                                                newTxList.push({
                                                    id: txId,
                                                    type: 'wallet_load',
                                                    description: `Tahsilat: ${s.name}`,
                                                    amount: amount,
                                                    date,
                                                    time
                                                });
                                                return { ...s, balance: 0 };
                                            }
                                            return s;
                                        }

                                        // Collect All
                                        if (s.balance < 0) {
                                            const amount = Math.abs(s.balance);
                                            totalCollected += amount;
                                            // Tx ID
                                            const txId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                                            newTxList.push({
                                                id: txId,
                                                type: 'wallet_load',
                                                description: `Toplu Tahsilat: ${s.name}`,
                                                amount: amount,
                                                date,
                                                time
                                            });
                                            return { ...s, balance: 0 };
                                        }
                                        return s;
                                    });

                                    if (totalCollected > 0) {
                                        updateActiveInstitution({
                                            students: updatedStudents,
                                            cash: cash + totalCollected,
                                            transactions: [...newTxList, ...transactions]
                                        });
                                        showToast(`${totalCollected}₺ başarıyla tahsil edildi`, 'success');
                                    } else {
                                        showToast('Tahsil edilecek borç bulunamadı', 'info');
                                    }

                                    setIsCollectModalOpen(false);
                                }}
                                className="py-3.5 text-white font-semibold bg-red-600 rounded-xl shadow-lg shadow-red-200 active:scale-95 transition-transform"
                            >
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Debtor List */}
            <div className="px-2">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    Borçlu Listesi
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">{debtors.length}</span>
                </h2>

                {debtors.length > 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                        {debtors.map(s => (
                            <div key={s.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    {s.photo ? (
                                        <img src={s.photo} className="w-10 h-10 rounded-full object-cover shadow-sm bg-gray-100" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                                            {s.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium text-gray-900">{s.name}</div>
                                        {/* Phone link */}
                                        <a href={`tel:${s.phone}`} className="text-xs text-gray-400 hover:text-ios-blue">
                                            {s.phone || 'Tel Yok'}
                                        </a>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-red-600 text-lg">{Math.abs(s.balance)}₺</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Borç</div>
                                    <button
                                        onClick={() => { setSelectedDebtor(s); setIsCollectModalOpen(true); }}
                                        className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-md font-bold active:bg-red-100 transition-colors"
                                    >
                                        Tahsil Et
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
                        Harika! Kimsenin borcu yok. 🎉
                    </div>
                )}
            </div>

            {/* Transaction History */}
            <div className="px-2">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    Son İşlemler
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">{(transactions || []).length}</span>
                </h2>

                {(transactions || []).length > 0 ? (
                    <div className="space-y-3">
                        {(transactions || []).slice(0, 10).map((tx) => (
                            <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tx.amount > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{tx.description || tx.type}</div>
                                        <div className="text-xs text-gray-400">{tx.date} • {tx.time}</div>
                                    </div>
                                </div>
                                <div className={`font-bold text-lg ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}₺
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
                        Henüz işlem kaydı yok.
                    </div>
                )}
            </div>
        </div>
    );
}
