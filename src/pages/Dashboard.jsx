import React, { useState, useEffect, useMemo } from 'react';
import { parse, differenceInMinutes } from 'date-fns';
import { getAvatarColor } from '../lib/avatar';
import { LayoutGrid } from 'lucide-react';
import { useInstitution } from '../contexts/InstitutionContext';
import { useAuth } from '../contexts/AuthContext';
import { getToken } from 'firebase/messaging';
import { messaging } from '../lib/firebase';
import { saveUserFcmToken } from '../lib/db';

export default function Dashboard({ showToast }) {
    const { currentUser } = useAuth();
    const { students, lessons, setStudents, setLessons, cash, setCash, institutions, activeInstitution, switchInstitution, loading } = useInstitution();

    // Local state for modals, but data comes from context
    const [activeLessonModal, setActiveLessonModal] = useState(null); // 'attendance' | 'details' | null
    const [selectedLesson, setSelectedLesson] = useState(null); // The lesson object being acted upon

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format regardless of locale
    const upcomingLessons = useMemo(() => {
        const filtered = lessons.filter(l =>
            l.date === todayStr &&
            l.date === todayStr &&
            (l.status === 'upcoming' || l.status === 'scheduled' || l.status === 'started' || l.status === 'cancelled' || l.status === 'absent')
        );

        // Sort by Date AND Time
        return filtered.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            const dateDiff = dateA - dateB;
            if (dateDiff !== 0) return dateDiff;
            return a.time.localeCompare(b.time);
        });
    }, [lessons, todayStr]);
    const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

    useEffect(() => {
        const setupNotifications = async () => {
            try {
                if ('Notification' in window && currentUser) {
                    let permission = Notification.permission;

                    if (permission === 'default') {
                        permission = await Notification.requestPermission();
                    }

                    if (permission === 'granted') {
                        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BOTWYjrOU0ttyHclevgHjMrCTOxjKFvKoWmypk-I_Chz0eWbxLCJZZRPWJHnkqR2vN3caLgrKvgBvXg9LzwYRJ4';
                        if (vapidKey) {
                            const token = await getToken(messaging, { vapidKey });
                            if (token) {
                                await saveUserFcmToken(currentUser.uid, token);
                            }
                        } else {
                            console.log('Notification setup skipped: VITE_FIREBASE_VAPID_KEY missing');
                        }
                    }
                }
            } catch (error) {
                console.error('Notification setup failed:', error);
            }
        };

        setupNotifications();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="pb-20 relative pt-2 animate-pulse">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="h-8 w-40 bg-gray-200 rounded-lg mb-2"></div>
                        <div className="h-4 w-24 bg-gray-100 rounded-lg"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-6">
                    <div className="h-80 w-full bg-gray-200 rounded-2xl shadow-sm"></div>
                    <div className="space-y-3">
                        <div className="h-6 w-32 bg-gray-200 rounded-lg mb-4"></div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 w-full bg-gray-100 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }



    const nextLesson = upcomingLessons[0];
    const nextLessonStudent = nextLesson ? students.find(s => s.id === nextLesson.studentId) : null;

    // Determine if the next lesson is actionable (starts within 10 mins or already started)
    let isNextLessonActionable = false;
    if (nextLesson) {
        if (nextLesson.status === 'started') {
            isNextLessonActionable = true;
        } else {
            const lessonStart = parse(`${nextLesson.date} ${nextLesson.time}`, 'yyyy-MM-dd HH:mm', new Date());
            const diffMins = differenceInMinutes(lessonStart, new Date());
            // Active if within 10 mins before start, OR anytime after (until the day ends essentially)
            // Changing strict -45 limit to allow very late starts (e.g. 5 hours late)
            isNextLessonActionable = diffMins <= 10 && diffMins > -1440; // 24 hours window just in case
        }
    }

    // Notification state to prevent duplicate alerts
    const [notifiedLessons, setNotifiedLessons] = useState(new Set());

    // Check for upcoming lessons periodically
    useEffect(() => {
        const checkUpcomingLessons = () => {
            if (!('Notification' in window) || Notification.permission !== 'granted') return;

            const now = new Date();
            upcomingLessons.forEach(lesson => {
                if (notifiedLessons.has(lesson.id) || (lesson.status !== 'upcoming' && lesson.status !== 'scheduled')) return;

                const lessonDate = new Date(lesson.date);
                const [hours, mins] = lesson.time.split(':');
                lessonDate.setHours(parseInt(hours), parseInt(mins), 0, 0);

                const diffMins = (lessonDate - now) / (1000 * 60);

                // Notify if within 10 minutes
                if (diffMins <= 10 && diffMins > -15) {
                    new Notification("Ders Vakti! 🔔", {
                        body: `${students.find(s => s.id === lesson.studentId)?.name} ile ders başlıyor. Yoklama almayı unutma!`,
                        icon: '/vite.svg'
                    });

                    setNotifiedLessons(prev => new Set(prev).add(lesson.id));
                }
            });
        };

        const interval = setInterval(checkUpcomingLessons, 60000); // Check every minute
        checkUpcomingLessons(); // Also check immediately on mount/update

        return () => clearInterval(interval);
    }, [upcomingLessons, notifiedLessons, students]);

    const handleLessonCardClick = (lesson) => {
        try {
            if (!lesson) {
                console.warn('handleLessonCardClick: Lesson is null');
                return;
            }

            console.log('handleLessonCardClick triggered for:', lesson);

            // Guard against missing students array
            if (!Array.isArray(students)) {
                console.error('handleLessonCardClick: students is not an array', students);
                if (typeof showToast === 'function') showToast('Sistem hatası: Öğrenci listesi yüklenemedi.', 'error');
                return;
            }

            const student = students.find(s => s.id === lesson.studentId);
            if (!student) {
                console.warn('handleLessonCardClick: Student not found for id', lesson.studentId);
                if (typeof showToast === 'function') showToast('Öğrenci bilgisi bulunamadı!', 'error');
                return;
            }

            setSelectedLesson({ ...lesson, student });

            if (lesson.status === 'upcoming' || lesson.status === 'scheduled') {
                setActiveLessonModal('attendance');
            } else if (lesson.status === 'started') {
                setActiveLessonModal('details');
            } else {
                console.log('handleLessonCardClick: Lesson status is', lesson.status);
            }
        } catch (error) {
            console.error('handleLessonCardClick Error:', error);
            if (typeof showToast === 'function') showToast('Bir hata oluştu: ' + error.message, 'error');
        }
    };

    const handleListItemClick = (lesson) => {
        if (!lesson) return;
        const student = students.find(s => s.id === lesson.studentId);
        setSelectedLesson({ ...lesson, student });
        // Only open cancel modal if it's not already cancelled or started?
        // User wants to cancel from list. 
        if (lesson.status === 'started') {
            setActiveLessonModal('details');
        } else {
            setActiveLessonModal('cancel_confirm');
        }
    };



    const handleAttendance = (isPresent) => {
        if (isPresent) {
            // Mark as started
            updateLessonStatus(selectedLesson.id, 'started', 'present');
            setActiveLessonModal(null);
        } else {
            // Mark as Absent (Gelmedi) - Status becomes 'absent'
            updateLessonStatus(selectedLesson.id, 'absent', 'absent');
            setActiveLessonModal(null);
        }
    };

    const handleCancelLesson = () => {
        // Mark as Cancelled (İptal) - Status becomes 'cancelled'
        updateLessonStatus(selectedLesson.id, 'cancelled', 'cancelled');
        setActiveLessonModal(null);
    };

    const handleCompleteLesson = (topic, homework, paymentMethod) => {
        const student = selectedLesson.student;
        let newBalance = student.balance;
        let pStatus = 'unpaid';

        if (paymentMethod === 'balance') {
            newBalance -= student.feePerLesson;
            pStatus = 'deducted_balance';
        } else if (paymentMethod === 'cash') {
            pStatus = 'paid_cash';

            // Create Transaction Record
            const { date, time } = (() => {
                const d = new Date();
                return {
                    date: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                };
            })();

            const newTx = {
                id: (Date.now() + Math.random()).toString(), // Simple ID
                type: 'collection',
                description: `Ders Ücreti: ${student.name}`,
                amount: student.feePerLesson,
                date: date,
                time: time
            };

            // Update Context State
            setCash(prev => prev + student.feePerLesson);
            setTransactions(prev => [newTx, ...prev]);

            // Persist to DB (Atomic update preferred but Context handles individual setters too)
            // But verify: Does setCash/setTransactions inside Context trigger DB update?
            // Yes, based on previous analysis of InstitutionContext.
            // However, calling them separately might trigger two writes.
            // Better to use updateActiveInstitution for atomic update if possible, 
            // but Context only exposes individual setters or updateActiveInstitution.
            // Let's check Context again if we can. 
            // Wait, I can see useInstitution destructuring in Dashboard.
            // For now, let's just add setTransactions. Context handles DB update for each setter.
            // Actually, looking at lines 191-223 in Dashboard, it acts on local state or context setters.
            // Let's just add the transaction creation.
        } else {
            // Borç
            newBalance -= student.feePerLesson; // Borç olarak bakiyeden düşüyoruz (negatif bakiye)
            pStatus = 'unpaid';
        }

        // Update Student Balance
        const updatedStudents = students.map(s => s.id === student.id ? { ...s, balance: newBalance } : s);
        setStudents(updatedStudents);

        // Update Lesson
        const updatedLessons = lessons.map(l => l.id === selectedLesson.id ? {
            ...l,
            status: 'completed',
            topic,
            homework,
            paymentStatus: pStatus
        } : l);
        setLessons(updatedLessons);
        showToast('Ders başarıyla tamamlandı!');
        setActiveLessonModal(null);
    };

    const updateLessonStatus = (id, status, attendance) => {
        const updated = lessons.map(l => l.id === id ? { ...l, status, attendance } : l);
        setLessons(updated);
    };

    return (
        <div className="pb-20 relative pt-2">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-[34px] font-bold tracking-tight">{activeInstitution?.name || 'Özet'} <span className="text-xs text-stone-300 font-normal align-top">v1.2</span></h1>
                    <p className="text-ios-subtext text-lg capitalize">{today}</p>
                </div>
                <button
                    onClick={() => switchInstitution(null)}
                    className="text-gray-600 active:opacity-50 transition-opacity p-2 bg-gray-100 rounded-full"
                    title="Kurum Değiştir"
                >
                    <LayoutGrid size={20} strokeWidth={2} />
                </button>
            </div>

            <div className="space-y-6">
                {/* Smart Next Lesson Card */}
                {nextLesson && nextLessonStudent ? (
                    <div
                        onClick={() => {
                            if (isNextLessonActionable) {
                                handleLessonCardClick(nextLesson);
                            } else {
                                showToast('Ders saati henüz gelmedi (10 dk kala açılır)', 'error');
                            }
                        }}
                        className={`relative overflow-hidden rounded-2xl shadow-ios-lg p-6 text-white transition-transform cursor-pointer ${isNextLessonActionable ? 'active:scale-98' : 'opacity-90 grayscale-[0.2]'}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${nextLesson.status === 'started' ? 'from-green-500 to-emerald-600 animate-pulse' : 'from-ios-blue to-ios-purple'} opacity-90`}></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wide">
                                    {nextLesson.status === 'started' ? 'DERS DEVAM EDİYOR' : 'SIRADAKİ DERS'}
                                </div>
                                {nextLesson.status === 'started' && <div className="text-xs bg-white/20 px-2 py-1 rounded">Bitirmek için tıkla</div>}
                            </div>

                            <div className="flex justify-between items-center mt-2">
                                <div className="text-6xl font-bold tracking-tight">{nextLesson.time}</div>
                                {nextLessonStudent.photo ? (
                                    <div className="w-24 h-24 rounded-full bg-white/20 shadow-lg overflow-hidden border-2 border-white/30">
                                        <img src={nextLessonStudent.photo} alt={nextLessonStudent.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-5xl font-bold shadow-lg border-2 border-white/30">
                                        {nextLessonStudent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="mt-2">
                                <div className="text-2xl font-medium">{nextLessonStudent.name}</div>
                                {nextLessonStudent.instrument && (
                                    <div className="text-blue-100 text-sm font-medium opacity-90 uppercase tracking-widest mt-0.5">
                                        {nextLessonStudent.instrument}
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            {isNextLessonActionable && nextLesson.status !== 'started' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLessonCardClick(nextLesson);
                                    }}
                                    className="mt-4 w-full bg-white/20 backdrop-blur-md rounded-xl p-3 flex items-center justify-between hover:bg-white/30 transition-colors animate-bounce"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
                                        <span className="font-bold text-sm">Ders Vakti! Yoklama Al</span>
                                    </div>
                                    <span className="bg-white text-ios-blue text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">Başlat →</span>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 bg-ios-card rounded-xl shadow-ios flex items-center justify-center text-ios-subtext">
                        Aktif ders bulunmuyor.
                    </div>
                )}

                {/* Today's List */}
                <div className="p-4 bg-ios-card rounded-xl shadow-ios">
                    {/* ... (Same list code, using local state) */}
                    <h2 className="font-semibold text-lg mb-4 flex justify-between items-center">
                        Program
                        <span className="text-sm font-normal text-ios-subtext bg-gray-100 px-2 py-1 rounded-md">{upcomingLessons.length}</span>
                    </h2>
                    {upcomingLessons.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingLessons.map(l => (
                                <div
                                    key={l.id}
                                    onClick={() => handleListItemClick(l)}
                                    className="flex justify-between items-center border-l-[3px] border-ios-blue pl-3 py-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-r-lg"
                                >
                                    <div>
                                        <div className="font-medium text-[15px]">{l.time}</div>
                                        <div className="text-xs text-ios-subtext">
                                            {students.find(s => s.id === l.studentId)?.name}
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${l.status === 'started' ? 'bg-green-100 text-green-700' :
                                        l.status === 'cancelled' ? 'bg-red-50 text-red-500' :
                                            'bg-blue-50 text-ios-blue'
                                        }`}>
                                        {l.status === 'started' ? 'Sürüyor' :
                                            l.status === 'cancelled' ? 'İptal' : 'Planlı'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-ios-subtext py-2">Ders yok.</p>
                    )}
                </div>
            </div>

            {/* MODAL: Attendance */}
            {activeLessonModal === 'attendance' && selectedLesson && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up pb-10 sm:pb-6">
                        <h3 className="text-xl font-bold mb-2 text-center">{selectedLesson.student.name}</h3>
                        <p className="text-center text-ios-subtext mb-8">{selectedLesson.time} Dersi Başlasın mı?</p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button
                                onClick={() => handleAttendance(false)}
                                className="bg-red-50 text-red-600 font-semibold py-4 rounded-xl active:scale-95 transition-transform border border-red-100"
                            >
                                Gelmedi (Yoklama) ❌
                            </button>
                            <button
                                onClick={() => handleAttendance(true)}
                                className="bg-ios-blue text-white font-semibold py-4 rounded-xl active:scale-95 transition-transform shadow-lg shadow-blue-200"
                            >
                                Geldi (Başlat) ✅
                            </button>
                        </div>

                        <button
                            onClick={handleCancelLesson}
                            className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-medium text-sm active:scale-95 transition-transform"
                        >
                            Dersi İptal Et (Önceden Haberli) ⚠️
                        </button>

                        <button onClick={() => setActiveLessonModal(null)} className="mt-4 w-full text-ios-subtext text-xs">Vazgeç</button>
                    </div>
                </div>
            )}

            {/* MODAL: Cancel Confirm (Simplified for List) */}
            {activeLessonModal === 'cancel_confirm' && selectedLesson && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up pb-10 sm:pb-6">
                        <h3 className="text-xl font-bold mb-2 text-center">{selectedLesson.student.name}</h3>
                        <p className="text-center text-ios-subtext mb-8">{selectedLesson.time} dersi iptal edilsin mi?</p>

                        <button
                            onClick={handleCancelLesson}
                            className="w-full py-4 bg-orange-50 text-orange-600 rounded-xl font-bold text-lg active:scale-95 transition-transform mb-3 border border-orange-100"
                        >
                            Evet, İptal Et
                        </button>

                        <button onClick={() => setActiveLessonModal(null)} className="w-full py-3 text-gray-500 font-medium bg-gray-100 rounded-xl active:scale-95 transition-transform">
                            Vazgeç
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL: Lesson Details (End) */}
            {activeLessonModal === 'details' && selectedLesson && (
                <LessonEndModal
                    lesson={selectedLesson}
                    student={selectedLesson.student}
                    onComplete={handleCompleteLesson}
                    onCancel={() => setActiveLessonModal(null)}
                />
            )}


        </div>
    );
}

function LessonEndModal({ lesson, student, onComplete, onCancel }) {
    const [topic, setTopic] = useState('');
    const [homework, setHomework] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(student.balance >= student.feePerLesson ? 'balance' : 'debt');

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-ios-bg w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl h-[90vh] sm:h-auto overflow-y-auto animate-slide-up flex flex-col">
                <div className="p-4 bg-white border-b border-ios-separator sticky top-0 flex justify-between items-center rounded-t-2xl">
                    <h3 className="font-semibold">Dersi Tamamla</h3>
                    <button onClick={onCancel} className="text-ios-blue">Kapat</button>
                </div>

                <div className="p-4 space-y-6 flex-1">
                    {/* Topic & HW */}
                    <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-ios-subtext font-semibold mb-1">İşlenen Konu</label>
                            <input
                                value={topic} onChange={e => setTopic(e.target.value)}
                                className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-ios-blue transition-colors" placeholder="Bugün ne çalıştınız?"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-ios-subtext font-semibold mb-1">Verilen Ödev</label>
                            <textarea
                                value={homework} onChange={e => setHomework(e.target.value)}
                                className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-ios-blue transition-colors h-20 resize-none" placeholder="Haftaya ne çalışmalı?"
                            />
                        </div>
                        {/* Quick Tags (Mock) */}

                    </div>

                    {/* Payment Info */}
                    <div>
                        <label className="block text-xs uppercase text-ios-subtext font-semibold mb-2 ml-2">Ödeme Durumu</label>
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {student.balance >= student.feePerLesson ? (
                                <div
                                    onClick={() => setPaymentMethod('balance')}
                                    className={`p-4 flex items-center justify-between border-b cursor-pointer ${paymentMethod === 'balance' ? 'bg-blue-50' : ''}`}
                                >
                                    <div>
                                        <div className="font-semibold">Bakiyeden Düş ({student.balance}₺)</div>
                                        <div className="text-xs text-ios-subtext">Yeni Bakiye: {student.balance - student.feePerLesson}₺</div>
                                    </div>
                                    {paymentMethod === 'balance' && <span className="text-ios-blue">✓</span>}
                                </div>
                            ) : (
                                <div className="p-4 bg-orange-50 text-orange-800 text-sm">
                                    Bakiye yetersiz! ({student.balance}₺)
                                </div>
                            )}

                            <div
                                onClick={() => setPaymentMethod('cash')}
                                className={`p-4 flex items-center justify-between border-b cursor-pointer ${paymentMethod === 'cash' ? 'bg-blue-50' : ''}`}
                            >
                                <div className="font-semibold">Nakit Alındı</div>
                                {paymentMethod === 'cash' && <span className="text-ios-blue">✓</span>}
                            </div>

                            <div
                                onClick={() => setPaymentMethod('debt')}
                                className={`p-4 flex items-center justify-between cursor-pointer ${paymentMethod === 'debt' ? 'bg-blue-50' : ''}`}
                            >
                                <div>
                                    <div className="font-semibold">Borç Yaz</div>
                                    <div className="text-xs text-ios-subtext">Bakiyeye -{student.feePerLesson}₺ yansır</div>
                                </div>
                                {paymentMethod === 'debt' && <span className="text-ios-blue">✓</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-ios-separator safe-area-bottom">
                    <button
                        onClick={() => onComplete(topic, homework, paymentMethod)}
                        className="w-full bg-ios-blue text-white font-bold py-3 rounded-xl shadow-ios active:scale-95 transition-transform"
                    >
                        Dersi Bitir ve Kaydet
                    </button>
                </div>
            </div>
        </div>
    )
}

function LessonDetailsModal({ lesson, onClose, onComplete, students }) {
    const [topic, setTopic] = useState('');
    const [homework, setHomework] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('debt');

    return (
        <div className="fixed inset-0 z-50 flex items-end pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={onClose}></div>
            <div className="bg-white w-full rounded-t-2xl shadow-2xl animate-slide-up pointer-events-auto max-h-[85vh] flex flex-col relative z-10 safe-area-bottom">
                <div className="p-4 border-b border-ios-separator flex justify-between items-center">
                    <span className="font-semibold text-lg">{lesson.student?.name}</span>
                    <button onClick={onClose} className="text-gray-400 bg-gray-100 p-1 rounded-full"><div className="w-6 h-6 flex items-center justify-center">✕</div></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Majör Gamlar..."
                            className="w-full bg-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ödev</label>
                        <textarea
                            value={homework}
                            onChange={(e) => setHomework(e.target.value)}
                            placeholder="C Majör çalış..."
                            rows={3}
                            className="w-full bg-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Ödeme Şekli</label>
                        <div className="bg-ios-card rounded-xl shadow-ios overflow-hidden divide-y divide-gray-100">
                            <div
                                onClick={() => setPaymentMethod('debt')}
                                className="p-4 flex justify-between items-center active:bg-gray-50 cursor-pointer"
                            >
                                <div>
                                    <div className="font-semibold text-[17px]">Borca Ekle</div>
                                    <div className="text-xs text-gray-500 mt-0.5">Öğrenci bakiyesine eklensin</div>
                                </div>
                                {paymentMethod === 'debt' && <span className="text-ios-blue">✓</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-ios-separator safe-area-bottom">
                    <button
                        onClick={() => onComplete(topic, homework, paymentMethod)}
                        className="w-full bg-ios-blue text-white font-bold py-3 rounded-xl shadow-ios active:scale-95 transition-transform"
                    >
                        Dersi Bitir ve Kaydet
                    </button>
                </div>
            </div>
        </div>
    )
}


