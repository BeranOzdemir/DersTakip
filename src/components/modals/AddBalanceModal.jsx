import React from 'react';
import { parseAmount } from '../../lib/utils';

/**
 * Modal for adding balance to a student's wallet
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onConfirm - Callback with amount when confirmed
 * @param {string} props.studentName - Name of the student
 * @param {number} props.currentBalance - Current balance of student
 * @param {Function} props.showToast - Toast notification function
 */
export default function AddBalanceModal({
    isOpen,
    onClose,
    onConfirm,
    studentName,
    currentBalance = 0,
    showToast
}) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        const val = document.getElementById('balanceInput')?.value;
        if (!val) {
            showToast?.('Lütfen bir tutar giriniz.', 'error');
            return;
        }

        const amount = parseAmount(val);
        if (amount === null) {
            showToast?.('Geçerli bir tutar giriniz.', 'error');
            return;
        }

        onConfirm(amount);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            <div className="bg-white w-full max-w-[320px] rounded-2xl p-6 shadow-2xl animate-scale-in relative z-10">
                <h3 className="text-xl font-bold text-center mb-2">Bakiye Ekle</h3>
                <p className="text-center text-gray-500 mb-4 text-sm">
                    {studentName}
                </p>

                {/* Current Balance Display */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">Mevcut Bakiye</div>
                    <div className={`text-lg font-bold ${currentBalance >= 0 ? 'text-ios-green' : 'text-ios-red'}`}>
                        {currentBalance >= 0 ? '+' : ''}{currentBalance}₺
                    </div>
                </div>

                {/* Amount Input */}
                <input
                    id="balanceInput"
                    type="number"
                    className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[17px] mb-6 focus:outline-none focus:ring-2 focus:ring-ios-blue/50"
                    placeholder="Tutar (₺)"
                    autoFocus
                    onKeyPress={handleKeyPress}
                />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onClose}
                        className="bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl active:scale-95 transition-transform"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="bg-ios-blue text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform"
                    >
                        Onayla
                    </button>
                </div>
            </div>
        </div>
    );
}
