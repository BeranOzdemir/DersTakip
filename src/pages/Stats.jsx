import React from 'react';
import { useInstitution } from '../contexts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';

export default function Stats() {
    const { students, lessons, activeInstitution } = useInstitution();

    // 1. Calculate Monthly Stats
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

            {/* Total Debt Banner */}
            <div className="mx-2 bg-red-50 p-4 rounded-2xl border border-red-100 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                        <TrendingDown size={18} />
                        <span className="font-semibold text-sm">Toplam Alacak</span>
                    </div>
                    <div className="text-3xl font-bold text-red-700">{totalDebt}₺</div>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                    <AlertCircle size={24} />
                </div>
            </div>

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
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Borç</div>
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
        </div>
    );
}
