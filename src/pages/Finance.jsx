import React, { useState } from 'react';
import { List, ListItem } from '../components/ui/List';
import { Plus, Minus, ArrowUpRight } from 'lucide-react';
import { parseAmount, formatDateTime } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useInstitution } from '../contexts';

export default function Finance({ showToast, onTransferToGlobalSafe }) {
    const { students, setStudents, cash, setCash, transactions, setTransactions, updateActiveInstitution: updateInstitution } = useInstitution();

    const [isCollectConfirmOpen, setIsCollectConfirmOpen] = useState(false);
    const [view, setView] = useState('main'); // 'main' | 'history'
    const [isGlobalTransferOpen, setIsGlobalTransferOpen] = useState(false);

    // Calculate Financials based on PROPS, not mock
    // Net Receivables (Negative Balances)
    const totalReceivables = students.filter(s => s.balance < 0).reduce((acc, s) => acc + Math.abs(s.balance), 0);

    const totalEarnings = cash + totalReceivables;

    const handleCollectAll = () => {
        if (totalReceivables === 0) {
            showToast('Tahsil edilecek alacak bulunmuyor.', 'info');
            return;
        }
        setIsCollectConfirmOpen(true);
    };

    const confirmCollection = () => {
        // 1. Move all receivables to Cash
        const receivables = totalReceivables;
        const newCash = cash + receivables;

        // 2. Zero out NEGATIVE balances (Debts)
        const updatedStudents = students.map(s => s.balance < 0 ? { ...s, balance: 0 } : s);

        // Batch Update
        updateInstitution({
            cash: newCash,
            students: updatedStudents
        });

        showToast(`Tüm alacaklar (${receivables}₺) tahsil edildi ve kasaya eklendi!`);
        setIsCollectConfirmOpen(false);
    };


    const [paymentModalData, setPaymentModalData] = useState(null); // { studentId, name, balance, feePerLesson }
    const [confirmPayment, setConfirmPayment] = useState(null); // { amount, label }

    const handleOpenPaymentModal = (student) => {
        setPaymentModalData(student);
        setConfirmPayment(null);
    };

    const handleProcessPayment = (amount, label) => {
        // Instead of processing immediately, set confirmation
        setConfirmPayment({ amount, label });
    };

    const finalizePayment = () => {
        if (!paymentModalData || !confirmPayment) return;

        const { amount, label } = confirmPayment;
        const { date, time, shortDate } = formatDateTime();

        // Prepare new values
        const newCash = cash + amount;
        const newStudents = students.map(s => s.id === paymentModalData.id ? { ...s, balance: s.balance + amount } : s);

        const newTx = {
            id: uuidv4(),
            type: paymentModalData.name,
            description: `${shortDate} tarihli ders ödemesi`,
            amount: amount,
            date: date,
            time: time
        };
        const newTransactions = [newTx, ...transactions];

        // Batch Update
        updateInstitution({
            cash: newCash,
            students: newStudents,
            transactions: newTransactions
        });

        showToast(`${paymentModalData.name}: Ödeme başarıyla alındı.`);
        setPaymentModalData(null);
        setConfirmPayment(null);
    };



    // Transaction Modal State (Income or Expense)
    const [transactionModal, setTransactionModal] = useState(null); // 'income' | 'expense' | null

    const handleSaveTransaction = () => {
        const desc = document.getElementById('transDesc').value;
        const amountVal = document.getElementById('transAmount').value;

        if (!desc || !amountVal) {
            showToast('Lütfen açıklama ve tutar giriniz.', 'error');
            return;
        }

        const amount = parseAmount(amountVal);
        if (amount === null) {
            showToast('Geçerli bir tutar giriniz.', 'error');
            return;
        }

        const type = transactionModal; // 'income' or 'expense'
        const { date, time } = formatDateTime();

        // Update Cash
        // Income adds to cash, Expense reduces cash
        const newCash = type === 'income' ? cash + amount : cash - amount;

        // Add Transaction
        const newTx = {
            id: uuidv4(),
            type: type === 'income' ? 'Gelir' : 'Gider',
            description: desc,
            amount: type === 'income' ? amount : -amount, // Positive for income, Negative for expense
            date: date,
            time: time
        };
        const newTransactions = [newTx, ...transactions];

        updateInstitution({
            cash: newCash,
            transactions: newTransactions
        });

        showToast(`${type === 'income' ? 'Gelir' : 'Gider'} kaydedildi.`);
        setTransactionModal(null);
    };

    const handleGlobalTransfer = () => {
        const amountVal = document.getElementById('globalTransferAmount').value;
        if (!amountVal) return;

        const amount = parseAmount(amountVal);
        if (amount === null) {
            showToast('Geçerli bir tutar giriniz.', 'error');
            return;
        }

        if (amount > cash) {
            showToast('Kasada yeterli bakiye yok.', 'error');
            return;
        }

        if (onTransferToGlobalSafe) {
            onTransferToGlobalSafe(amount);
            setIsGlobalTransferOpen(false);
        }
    };

    const [selectedTransaction, setSelectedTransaction] = useState(null);

    return (
        <div className="pb-20">
            <h1 className="text-[34px] font-bold tracking-tight mb-6">Finans</h1>

            {/* Transaction History Full Screen View */}
            {view === 'history' ? (
                <div className="fixed inset-0 z-[50] bg-ios-bg animate-slide-up overflow-auto">
                    <div className="p-4 flex items-center gap-2 bg-white/80 backdrop-blur-md border-b border-ios-separator sticky top-0 z-10 pt-safe-top">
                        <button
                            onClick={() => setView('main')}
                            className="text-ios-blue text-[17px] active:opacity-50 flex items-center pl-0"
                        >
                            <span className="text-3xl items-center flex mr-1 pb-1">‹</span> Geri
                        </button>
                        <span className="font-semibold absolute left-1/2 -translate-x-1/2">Tüm İşlemler</span>
                    </div>
                    <div className="p-4 pb-20">
                        <List>
                            {transactions.map(tx => (
                                <ListItem
                                    key={tx.id}
                                    title={tx.description}
                                    subtitle={`${tx.date} • ${tx.time}`}
                                    onClick={() => setSelectedTransaction(tx)}
                                    rightContent={
                                        <span className={`font-bold ${tx.amount > 0 ? 'text-ios-green' : 'text-ios-red'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}₺
                                        </span>
                                    }
                                />
                            ))}
                        </List>

                        <div className="mt-6 flex justify-center text-xs text-gray-400">
                            Toplam {transactions.length} işlem kaydı.
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div
                            onClick={handleCollectAll}
                            className="bg-ios-card p-4 rounded-xl shadow-ios flex flex-col justify-between active:scale-98 transition-transform cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-2 right-2 text-ios-blue opacity-20">
                            </div>
                            <span className="text-ios-subtext text-xs uppercase font-semibold mb-1">Toplam Alacak</span>
                            <span className="text-2xl font-bold text-ios-red">{totalReceivables}₺</span>
                        </div>
                        <div className="bg-ios-card p-4 rounded-xl shadow-ios flex flex-col justify-between relative group">
                            <div>
                                <span className="text-ios-subtext text-xs uppercase font-semibold mb-1">Kasa</span>
                                <div className={`text-2xl font-bold ${cash < 0 ? 'text-ios-red' : 'text-ios-green'}`}>
                                    {cash}₺
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsGlobalTransferOpen(true); }}
                                className="absolute bottom-3 right-3 bg-gray-100 p-2 rounded-full text-gray-600 active:bg-ios-blue active:text-white transition-colors"
                            >
                                <ArrowUpRight size={18} />
                            </button>
                        </div>
                    </div>

                    <h2 className="text-ios-subtext uppercase text-[13px] mb-2 ml-4">ÖDEMESİ GECİKENLER / ALACAKLAR</h2>
                    <List className="mb-6">
                        {students.filter(s => s.balance < 0).map(student => {
                            // Calculate lesson count debt (using Abs)
                            const debtAmount = Math.abs(student.balance);
                            const lessonCount = student.feePerLesson ? Math.ceil(debtAmount / student.feePerLesson) : 0;
                            return (
                                <ListItem
                                    key={student.id}
                                    title={student.name}
                                    subtitle={`${lessonCount} Ders (${debtAmount}₺) ödemesi var`}
                                    rightContent={
                                        <button
                                            onClick={() => handleOpenPaymentModal(student)}
                                            className="text-ios-blue text-sm font-semibold active:opacity-50"
                                        >
                                            Ödeme Al
                                        </button>
                                    }
                                />
                            );
                        })}
                        {students.filter(s => s.balance < 0).length === 0 && (
                            <div className="p-4 text-center text-ios-subtext">Herkes ödemesini yapmış.</div>
                        )}
                    </List>

                    <h2 className="text-ios-subtext uppercase text-[13px] mb-2 ml-4">SON İŞLEMLER</h2>
                    <List>
                        {transactions.slice(0, 4).map(tx => (
                            <ListItem
                                key={tx.id}
                                title={tx.description}
                                subtitle={`${tx.date} • ${tx.time}`}
                                onClick={() => setSelectedTransaction(tx)}
                                rightContent={
                                    <span className={`font-bold ${tx.amount > 0 ? 'text-ios-green' : 'text-ios-red'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount}₺
                                    </span>
                                }
                            />
                        ))}
                    </List>

                    {transactions.length > 4 && (
                        <button
                            onClick={() => setView('history')}
                            className="w-full text-center py-3 text-ios-blue font-medium text-sm active:opacity-50"
                        >
                            Tümünü Gör
                        </button>
                    )}

                    <div className="h-4"></div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setTransactionModal('income')}
                            className="bg-white text-ios-green py-3 rounded-xl font-semibold shadow-ios active:scale-95 transition-transform flex items-center justify-center gap-2 border border-green-100"
                        >
                            Gelir Ekle
                        </button>
                        <button
                            onClick={() => setTransactionModal('expense')}
                            className="bg-white text-ios-red py-3 rounded-xl font-semibold shadow-ios active:scale-95 transition-transform flex items-center justify-center gap-2 border border-red-100"
                        >
                            Gider Ekle
                        </button>
                    </div>
                </>
            )}

            {/* Global Transfer Modal */}
            {isGlobalTransferOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={() => setIsGlobalTransferOpen(false)}></div>
                    <div className="bg-white w-full sm:w-[320px] pointer-events-auto p-6 z-10 rounded-t-2xl sm:rounded-2xl animate-slide-up shadow-2xl">
                        <h3 className="text-xl font-bold mb-2">Genel Kasaya Aktar</h3>
                        <p className="text-ios-subtext text-xs mb-4">Bu kurumun kasasındaki parayı Ana Kasaya aktarır.</p>

                        <div className="mb-6">
                            <label className="block text-xs uppercase text-ios-subtext font-semibold mb-1">Aktarılacak Tutar</label>
                            <input id="globalTransferAmount" type="number" className="w-full bg-gray-100 rounded-xl py-3 px-4 text-[17px] focus:outline-none" placeholder={`Max: ${cash}₺`} autoFocus />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsGlobalTransferOpen(false)}
                                className="flex-1 bg-gray-200 text-gray-800 py-3.5 rounded-xl font-semibold active:scale-95 transition-transform"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleGlobalTransfer}
                                className="flex-1 bg-gray-800 text-white py-3.5 rounded-xl font-semibold shadow-lg active:scale-95 transition-transform"
                            >
                                Aktar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collect Confirmation Modal (Global) */}
            {isCollectConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={() => setIsCollectConfirmOpen(false)}></div>
                    <div className="bg-transparent w-full sm:w-[320px] pointer-events-auto p-4 z-10 flex flex-col gap-2 animate-slide-up">
                        <div className="bg-white/90 backdrop-blur rounded-xl overflow-hidden">
                            <div className="p-4 text-center border-b border-gray-300/50">
                                <h3 className="text-sm font-semibold text-gray-500">Tüm ödemeler alındı mı?</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Toplam <strong>{totalReceivables}₺</strong> alacak kasaya aktarılacak ve öğrenci bakiyeleri sıfırlanacak.
                                </p>
                            </div>
                            <button
                                onClick={confirmCollection}
                                className="w-full py-3.5 text-[17px] font-semibold text-ios-blue active:bg-gray-100 transition-colors"
                            >
                                Evet, Hepsini Tahsil Et
                            </button>
                        </div>
                        <button
                            onClick={() => setIsCollectConfirmOpen(false)}
                            className="bg-white w-full py-3.5 rounded-xl font-semibold text-[17px] text-ios-red shadow-lg active:scale-95 transition-transform"
                        >
                            Vazgeç
                        </button>
                    </div>
                </div>
            )}

            {/* Individual Payment Modal (Action Sheet Style) */}
            {paymentModalData && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={() => setPaymentModalData(null)}></div>
                    <div className="bg-transparent w-full sm:w-[320px] pointer-events-auto p-4 z-10 flex flex-col gap-2 animate-slide-up">

                        {/* If confirmation pending, show confirmation UI instead of options */}
                        {confirmPayment ? (
                            <div className="bg-white/90 backdrop-blur rounded-xl overflow-hidden">
                                <div className="p-4 text-center border-b border-gray-300/50">
                                    <h3 className="text-sm font-semibold text-gray-500">Onaylıyor musunuz?</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Öğrenci: <strong>{paymentModalData.name}</strong><br />
                                        İşlem: <strong>{confirmPayment.label} ({confirmPayment.amount}₺)</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={finalizePayment}
                                    className="w-full py-3.5 text-[17px] font-semibold text-ios-blue active:bg-gray-100 transition-colors"
                                >
                                    Evet, Tahsil Et
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white/90 backdrop-blur rounded-xl overflow-hidden divide-y divide-gray-200">
                                <div className="p-4 text-center">
                                    <h3 className="text-sm font-semibold text-gray-500">Ödeme Al: {paymentModalData.name}</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Toplam Borç: <strong>{Math.abs(paymentModalData.balance)}₺</strong>
                                        {paymentModalData.feePerLesson && ` (${Math.ceil(Math.abs(paymentModalData.balance) / paymentModalData.feePerLesson)} Ders)`}
                                    </p>
                                </div>

                                {/* Dynamic Buttons based on Lesson Count */}
                                {(() => {
                                    const fee = paymentModalData.feePerLesson || 0;
                                    const balance = Math.abs(paymentModalData.balance); // Work with positive debt value
                                    const count = fee > 0 ? Math.ceil(balance / fee) : 0;
                                    const buttons = [];

                                    // If count > 1, show 1 Lesson Option
                                    if (count > 1) {
                                        buttons.push(
                                            <button
                                                key="1lesson"
                                                onClick={() => handleProcessPayment(fee, '1 Ders Ücreti')}
                                                className="w-full py-3 text-[17px] text-ios-blue active:bg-gray-100 transition-colors"
                                            >
                                                1 Ders Ödendi ({fee}₺)
                                            </button>
                                        );
                                    }

                                    // If count > 2, show 2 Lessons Option (optional, maybe just show all intermediate? limit to 3 usually)
                                    if (count > 2) {
                                        buttons.push(
                                            <button
                                                key="2lesson"
                                                onClick={() => handleProcessPayment(fee * 2, '2 Ders Ücreti')}
                                                className="w-full py-3 text-[17px] text-ios-blue active:bg-gray-100 transition-colors"
                                            >
                                                2 Ders Ödendi ({fee * 2}₺)
                                            </button>
                                        );
                                    }

                                    return buttons;
                                })()}

                                <button
                                    onClick={() => handleProcessPayment(Math.abs(paymentModalData.balance), 'Tüm Borç')}
                                    className="w-full py-3.5 text-[17px] font-semibold text-ios-green active:bg-gray-100 transition-colors"
                                >
                                    Tümü Ödendi ({Math.abs(paymentModalData.balance)}₺)
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (confirmPayment) {
                                    setConfirmPayment(null); // Back to options
                                } else {
                                    setPaymentModalData(null); // Close modal
                                }
                            }}
                            className="bg-white w-full py-3.5 rounded-xl font-semibold text-[17px] text-ios-red shadow-lg active:scale-95 transition-transform"
                        >
                            {confirmPayment ? 'Geri Dön' : 'Vazgeç'}
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                        onClick={() => setSelectedTransaction(null)}
                    ></div>
                    <div className="bg-white/80 backdrop-blur-xl w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-scale-in z-10">
                        <div className="text-center mb-6">
                            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <span className="text-2xl">
                                    {selectedTransaction.amount > 0 ? '💰' : '💸'}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedTransaction.amount > 0 ? 'Ödeme Alındı' : 'Gider'}</h3>
                            <p className="text-3xl font-bold mt-2" style={{ color: selectedTransaction.amount > 0 ? '#34C759' : '#FF3B30' }}>
                                {selectedTransaction.amount > 0 ? '+' : ''}{selectedTransaction.amount}₺
                            </p>
                        </div>

                        <div className="bg-white/50 rounded-xl p-4 space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-200/50 pb-2">
                                <span className="text-gray-500">İşlem Türü</span>
                                <span className="font-semibold text-gray-900">{selectedTransaction.type}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200/50 pb-2">
                                <span className="text-gray-500">Açıklama</span>
                                <span className="font-semibold text-gray-900">{selectedTransaction.description}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200/50 pb-2">
                                <span className="text-gray-500">Tarih</span>
                                <span className="font-semibold text-gray-900">{selectedTransaction.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Saat</span>
                                <span className="font-semibold text-gray-900">{selectedTransaction.time}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedTransaction(null)}
                            className="w-full mt-6 bg-white py-3 rounded-xl font-semibold text-ios-blue shadow-sm active:scale-95 transition-transform"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}

            {/* Add Transaction Modal */}
            {transactionModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={() => setTransactionModal(null)}></div>
                    <div className="bg-white w-full sm:w-[320px] pointer-events-auto p-6 z-10 rounded-t-2xl sm:rounded-2xl animate-slide-up shadow-2xl">
                        <h3 className={`text-xl font-bold mb-4 ${transactionModal === 'income' ? 'text-ios-green' : 'text-ios-red'}`}>
                            {transactionModal === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs uppercase text-ios-subtext font-semibold mb-1">Açıklama</label>
                                <input id="transDesc" type="text" className="w-full bg-gray-100 rounded-xl py-3 px-4 text-[17px] focus:outline-none" placeholder={transactionModal === 'income' ? 'Örn: Ekstra Ders, Satış' : 'Örn: Kira, Fatura'} autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-ios-subtext font-semibold mb-1">Tutar (₺)</label>
                                <input id="transAmount" type="number" className="w-full bg-gray-100 rounded-xl py-3 px-4 text-[17px] focus:outline-none" placeholder="0" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setTransactionModal(null)}
                                className="flex-1 bg-gray-200 text-gray-800 py-3.5 rounded-xl font-semibold active:scale-95 transition-transform"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleSaveTransaction}
                                className={`flex-1 text-white py-3.5 rounded-xl font-semibold shadow-lg active:scale-95 transition-transform ${transactionModal === 'income' ? 'bg-ios-green shadow-green-200' : 'bg-ios-red shadow-red-200'}`}
                            >
                                Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
