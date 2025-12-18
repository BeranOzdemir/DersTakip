import React, { useState } from 'react';
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addWeeks, addMonths, parseISO, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, Clock, ChevronDown, Repeat, X, Trash2, XCircle, AlertTriangle, Edit } from 'lucide-react';
import { useInstitution } from '../contexts';

export default function Schedule({ showToast, onNavigate }) {
    const { lessons, setLessons, students, setStudents, updateActiveInstitution: updateInstitution } = useInstitution();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null); // NULL if adding, Lesson Object if editing

    // Add Lesson Form State
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [lessonDate, setLessonDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [lessonTime, setLessonTime] = useState('12:00');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState(format(addWeeks(new Date(), 4), 'yyyy-MM-dd'));

    // Week View Days
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

    // Month View Days
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Robust date checking for lessons
    const lessonsForDate = (lessons || []).filter(l => {
        if (!l || !l.date) return false;
        const d = new Date(l.date);
        return !isNaN(d.getTime()) && isSameDay(d, selectedDate);
    });

    const getStudentName = (id) => students?.find(s => s.id === parseInt(id) || s.id === id)?.name || 'Bilinmeyen';

    const hasLessonOnDate = (date) => {
        return (lessons || []).some(l => {
            if (!l || !l.date) return false;
            const d = new Date(l.date);
            return !isNaN(d.getTime()) && isSameDay(d, date);
        });
    };

    const handleStudentSelect = (studentId) => {
        setSelectedStudentId(studentId);
        setIsStudentPickerOpen(false);
    }

    // Date Picker State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [pickerDate, setPickerDate] = useState(new Date());
    const [pickerTarget, setPickerTarget] = useState('lesson'); // 'lesson' | 'recurrence'

    // Time Picker State
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    // Confirmation Modal State (Delete/Cancel)
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete'|'cancel', lesson: object }

    const handleDeleteClick = (lesson) => {
        setConfirmAction({ type: 'delete', lesson });
    };

    const handleCancelClick = (lesson) => {
        setConfirmAction({ type: 'cancel', lesson });
    };

    const performDelete = () => {
        if (!confirmAction?.lesson) return;

        const newLessons = lessons.filter(l => l.id !== confirmAction.lesson.id);
        setLessons(newLessons);

        showToast('Ders silindi.');
        setConfirmAction(null);
    };

    const performCancel = () => {
        if (!confirmAction?.lesson) return;

        const updatedLessons = lessons.map(l => {
            if (l.id === confirmAction.lesson.id) {
                return { ...l, status: 'cancelled', attendance: 'absent' };
            }
            return l;
        });

        setLessons(updatedLessons);
        showToast('Ders iptal edildi.');
        setConfirmAction(null);
    };

    const handleSaveLesson = () => {
        if (!selectedStudentId || !lessonTime || !lessonDate) return;

        // --- EDIT MODE ---
        if (editingLesson) {
            const updatedLessons = lessons.map(l => {
                if (l.id === editingLesson.id) {
                    return {
                        ...l,
                        studentId: parseInt(selectedStudentId),
                        date: format(parseISO(lessonDate), 'yyyy-MM-dd'),
                        time: lessonTime,
                        // Keep other fields same
                    };
                }
                return l;
            });
            setLessons(updatedLessons);
            showToast('Ders güncellendi!');
            setIsAddModalOpen(false);
            setEditingLesson(null);
            resetForm();
            return;
        }

        // --- ADD MODE ---
        const newLessons = [];
        let currentDate = parseISO(lessonDate);
        const endDate = isRecurring ? parseISO(recurrenceEndDate) : currentDate;

        let count = 0;
        while ((isRecurring ? currentDate <= endDate : count === 0) && count < 52) {
            const newLesson = {
                id: Date.now() + count,
                studentId: parseInt(selectedStudentId),
                date: format(currentDate, 'yyyy-MM-dd'),
                time: lessonTime,
                status: 'upcoming',
                topic: '',
                homework: ''
            };
            newLessons.push(newLesson);

            if (!isRecurring) break;
            currentDate = addWeeks(currentDate, 1);
            count++;
        }

        setLessons(prev => [...prev, ...newLessons]);
        showToast('Ders planlandı!');
        setIsAddModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedStudentId('');
        setIsRecurring(false);
        setEditingLesson(null);
    };

    const handleEditClick = (lesson) => {
        setEditingLesson(lesson);
        setSelectedStudentId(lesson.studentId);
        setLessonDate(lesson.date);
        setLessonTime(lesson.time);
        setIsRecurring(false); // Disable recurring edits for simplicity
        setIsAddModalOpen(true);
    };

    // Helper for generating time options
    const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div className="pb-20 pt-safe-top">
            <div className="px-4 sticky top-0 bg-ios-bg z-10 py-2">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-[34px] font-bold tracking-tight">Program</h1>
                    <div className="bg-gray-200 rounded-lg p-0.5 flex">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                        >
                            Haftalık
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                        >
                            Aylık
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar View */}
            <div className="px-4 mb-4">
                {viewMode === 'week' ? (
                    <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                        {weekDays.map((day) => {
                            const isSelected = isSameDay(day, selectedDate);
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`flex flex-col items-center justify-center min-w-[60px] h-[75px] rounded-xl border transition-all relative ${isSelected
                                        ? 'bg-ios-blue text-white border-ios-blue shadow-lg scale-105'
                                        : 'bg-white border-transparent text-ios-text shadow-sm'
                                        }`}
                                >
                                    <span className={`text-xs font-semibold uppercase ${isSelected ? 'text-white/80' : 'text-ios-subtext'}`}>
                                        {format(day, 'EEE', { locale: tr })}
                                    </span>
                                    <span className="text-xl font-bold mt-1">
                                        {format(day, 'd')}
                                    </span>
                                    {hasLessonOnDate(day) && (
                                        <span className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-ios-blue'}`}></span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm p-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setSelectedDate(prev => addMonths(prev, -1))}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                            >
                                <ChevronDown className="rotate-90" size={20} />
                            </button>
                            <div className="text-center font-semibold capitalize text-lg">
                                {format(selectedDate, 'MMMM yyyy', { locale: tr })}
                            </div>
                            <button
                                onClick={() => setSelectedDate(prev => addMonths(prev, 1))}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                            >
                                <ChevronDown className="-rotate-90" size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-400 mb-2">
                            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => <span key={d}>{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                            {/* Simple empty start filler - can be improved for exact day alignment */}
                            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`}></div>)}

                            {monthDays.map(day => {
                                const isSelected = isSameDay(day, selectedDate);
                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={`h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm font-medium relative transition-colors ${isSelected ? 'bg-ios-blue text-white' : 'text-gray-900 active:bg-gray-100'
                                            }`}
                                    >
                                        {format(day, 'd')}
                                        {hasLessonOnDate(day) && !isSelected && (
                                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-ios-blue"></span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-2 px-4">
                <h2 className="text-ios-subtext uppercase text-[13px] mb-2 font-medium">
                    {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr })}
                </h2>

                {lessonsForDate.length > 0 ? (
                    <div className="bg-ios-card rounded-xl shadow-ios overflow-hidden divide-y divide-ios-separator">
                        {lessonsForDate.map((lesson) => (
                            <div key={lesson.id} className={`p-4 flex items-center justify-between active:bg-gray-50 transition-colors ${lesson.status === 'cancelled' ? 'opacity-60 grayscale' : ''}`}>
                                <div>
                                    <h3 className={`font-semibold text-[17px] ${lesson.status === 'cancelled' ? 'line-through decoration-gray-400 text-gray-500' : ''}`}>
                                        {getStudentName(lesson.studentId)}
                                    </h3>
                                    <p className="text-sm text-ios-subtext flex items-center gap-2">
                                        <span>{lesson.time}</span>
                                        {lesson.status === 'cancelled' && <span className="text-red-500 font-medium text-xs bg-red-50 px-2 py-0.5 rounded">İptal Edildi</span>}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Actions for active lessons */}
                                    {lesson.status !== 'completed' && lesson.status !== 'cancelled' && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(lesson); }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 active:scale-95 transition-transform"
                                                title="Dersi Düzenle"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCancelClick(lesson); }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 text-orange-500 active:scale-95 transition-transform"
                                                title="Dersi İptal Et"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </>
                                    )}

                                    {/* Delete is always available, or maybe only for non-completed? Let's allow always for cleanup. */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(lesson); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 active:scale-95 transition-transform"
                                        title="Dersi Sil"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className={`px-2 py-1 rounded-md text-xs font-bold ${lesson.status === 'completed' ? 'bg-ios-green/10 text-ios-green' :
                                        lesson.status === 'cancelled' ? 'bg-red-50 text-red-400 hidden' : // Hidden label since we show it under name
                                            'bg-blue-50 text-ios-blue'
                                        }`}>
                                        {lesson.status === 'completed' ? 'Bitti' :
                                            lesson.status === 'cancelled' ? 'İptal' : 'Planlı'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-ios-subtext py-12 bg-white/50 rounded-xl border border-dashed border-gray-300 mx-auto">
                        <p className="mb-2">Bugün için ders yok.</p>
                        <button onClick={() => {
                            setLessonDate(format(selectedDate, 'yyyy-MM-dd'));
                            setIsAddModalOpen(true);
                        }} className="text-ios-blue font-medium text-sm">
                            + Ders Ekle
                        </button>
                    </div>
                )}
            </div>

            <button
                onClick={() => {
                    setLessonDate(format(selectedDate, 'yyyy-MM-dd'));
                    setIsAddModalOpen(true);
                }}
                className="fixed bottom-[100px] right-4 w-14 h-14 bg-ios-blue text-white rounded-full shadow-lg shadow-blue-300 flex items-center justify-center text-3xl font-light active:scale-90 transition-transform z-20"
            >
                +
            </button>


            {/* Add Lesson Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center pointer-events-none">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto"
                        onClick={() => setIsAddModalOpen(false)}
                    ></div>

                    <div className="bg-white w-full sm:w-[320px] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up pointer-events-auto flex flex-col p-4 pb-8 relative z-10 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-semibold text-lg">{editingLesson ? 'Dersi Düzenle' : 'Ders Ekle'}</span>
                            <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="text-gray-400 bg-gray-100 p-1 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-ios-subtext uppercase font-semibold mb-1 block">Öğrenci</label>
                                <div className="relative" onClick={() => setIsStudentPickerOpen(true)}>
                                    <div className={`w-full bg-gray-100 rounded-xl p-3 font-medium text-[17px] flex items-center justify-between ${selectedStudentId ? 'text-black' : 'text-gray-400'}`}>
                                        <span>{selectedStudentId ? getStudentName(selectedStudentId) : 'Öğrenci Seçiniz'}</span>
                                        <ChevronDown className="text-gray-400" size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-ios-subtext uppercase font-semibold mb-1 block">Tarih</label>
                                    <div
                                        onClick={() => {
                                            setPickerDate(parseISO(lessonDate));
                                            setPickerTarget('lesson');
                                            setIsDatePickerOpen(true);
                                        }}
                                        className="relative bg-gray-100 rounded-xl p-3 flex items-center justify-between active:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                        <span className="font-medium text-[17px] text-gray-900">
                                            {lessonDate ? format(parseISO(lessonDate), 'd MMM yyyy', { locale: tr }) : 'Tarih Seç'}
                                        </span>
                                        <Calendar className="text-gray-400" size={20} />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <label className="text-xs text-ios-subtext uppercase font-semibold mb-1 block">Saat</label>
                                    <div
                                        onClick={() => setIsTimePickerOpen(true)}
                                        className="relative bg-gray-100 rounded-xl p-3 flex items-center justify-between active:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                        <span className="font-medium text-[17px] text-gray-900">
                                            {lessonTime}
                                        </span>
                                        <Clock className="text-gray-400" size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-gray-50 mt-2 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-ios-green/10 flex items-center justify-center text-ios-green">
                                        <Repeat size={16} />
                                    </div>
                                    <span className="font-medium">Her hafta tekrarla</span>
                                </div>
                                <button
                                    onClick={() => setIsRecurring(!isRecurring)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${isRecurring ? 'bg-ios-green' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isRecurring ? 'translate-x-5' : ''}`}></span>
                                </button>
                            </div>

                            {isRecurring && (
                                <div className="bg-gray-50 p-4 rounded-xl animate-fade-in border border-gray-100">
                                    <label className="text-xs text-ios-subtext uppercase font-semibold mb-2 block flex justify-between">
                                        <span>Bitiş Tarihi</span>
                                        <span className="text-ios-blue font-normal capitalize"></span>
                                    </label>
                                    <div
                                        onClick={() => {
                                            setPickerDate(parseISO(recurrenceEndDate));
                                            setPickerTarget('recurrence');
                                            setIsDatePickerOpen(true);
                                        }}
                                        className="relative bg-white rounded-lg border border-gray-200 p-2 flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <span className="font-medium text-sm text-gray-900 pl-1">
                                            {recurrenceEndDate ? format(parseISO(recurrenceEndDate), 'd MMM yyyy', { locale: tr }) : 'Tarih Seç'}
                                        </span>
                                        <Calendar className="text-gray-400 mr-1" size={18} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                        Bu tarihe kadar her hafta <strong>{format(parseISO(lessonDate), 'EEEE', { locale: tr })}</strong> günleri saat <strong>{lessonTime}</strong> için ders planlanacak.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleSaveLesson}
                                disabled={!selectedStudentId || !lessonTime || !lessonDate}
                                className="w-full bg-ios-blue text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 mt-4"
                            >
                                {editingLesson ? 'Değişiklikleri Kaydet' : isRecurring ? 'Dersleri Planla' : 'Ekle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Date Picker Action Sheet */}
            {isDatePickerOpen && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center sm:justify-center pointer-events-none">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto"
                        onClick={() => setIsDatePickerOpen(false)}
                    ></div>

                    <div className="bg-white w-full sm:w-[320px] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up pointer-events-auto max-h-[70vh] flex flex-col relative z-10 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold text-lg">Tarih Seç</span>
                            <button onClick={() => setIsDatePickerOpen(false)} className="text-gray-400 bg-gray-100 p-1 rounded-full"><X size={20} /></button>
                        </div>

                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setPickerDate(prev => addWeeks(prev, -4))} className="p-1 hover:bg-gray-100 rounded-lg">←</button>
                            <span className="font-semibold capitalize">{format(pickerDate, 'MMMM yyyy', { locale: tr })}</span>
                            <button onClick={() => setPickerDate(prev => addWeeks(prev, 4))} className="p-1 hover:bg-gray-100 rounded-lg">→</button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-2">
                            {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(d => <span key={d}>{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty start filler */}
                            {Array.from({ length: (startOfMonth(pickerDate).getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`}></div>)}

                            {eachDayOfInterval({ start: startOfMonth(pickerDate), end: endOfMonth(pickerDate) }).map(day => {
                                const targetDate = pickerTarget === 'recurrence' ? recurrenceEndDate : lessonDate;
                                const isSelected = isSameDay(day, parseISO(targetDate));
                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => {
                                            const formatted = format(day, 'yyyy-MM-dd');
                                            if (pickerTarget === 'recurrence') {
                                                setRecurrenceEndDate(formatted);
                                            } else {
                                                setLessonDate(formatted);
                                            }
                                            setIsDatePickerOpen(false);
                                        }}
                                        className={`h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isSelected ? 'bg-ios-blue text-white' : 'text-gray-900 active:bg-gray-100'
                                            }`}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Time Picker Action Sheet */}
            {isTimePickerOpen && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center sm:justify-center pointer-events-none">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto"
                        onClick={() => setIsTimePickerOpen(false)}
                    ></div>

                    <div className="bg-white w-full sm:w-[320px] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up pointer-events-auto flex flex-col relative z-10 p-4">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                            <span className="font-semibold text-lg">Saat Seç</span>
                            <button onClick={() => setIsTimePickerOpen(false)} className="text-gray-400 bg-gray-100 p-1 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="flex h-[200px]">
                            {/* Hours Column */}
                            <div className="flex-1 overflow-y-scroll no-scrollbar text-center border-r border-gray-100">
                                <div className="text-xs text-gray-400 mb-2 sticky top-0 bg-white py-1">SAAT</div>
                                {HOURS.map(hour => (
                                    <button
                                        key={`h-${hour}`}
                                        onClick={() => setLessonTime(`${hour}:${lessonTime.split(':')[1]}`)}
                                        className={`w-full py-2.5 text-xl font-medium transition-colors ${lessonTime.startsWith(hour)
                                            ? 'text-ios-blue bg-blue-50'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {hour}
                                    </button>
                                ))}
                            </div>
                            {/* Minutes Column */}
                            <div className="flex-1 overflow-y-scroll no-scrollbar text-center">
                                <div className="text-xs text-gray-400 mb-2 sticky top-0 bg-white py-1">DAKİKA</div>
                                {MINUTES.map(minute => (
                                    <button
                                        key={`m-${minute}`}
                                        onClick={() => {
                                            setLessonTime(`${lessonTime.split(':')[0]}:${minute}`);
                                            // Close on minute select? User might want to adjust logic. Let's separate confirm.
                                        }}
                                        className={`w-full py-2.5 text-xl font-medium transition-colors ${lessonTime.endsWith(minute)
                                            ? 'text-ios-blue bg-blue-50'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {minute}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsTimePickerOpen(false)}
                            className="w-full mt-4 bg-ios-blue text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform"
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            )}

            {/* Student Picker Action Sheet (Z-Index higher than Add Modal: 110) */}
            {isStudentPickerOpen && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center sm:justify-center pointer-events-none">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto"
                        onClick={() => setIsStudentPickerOpen(false)}
                    ></div>

                    <div className="bg-white w-full sm:w-[320px] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up pointer-events-auto max-h-[70vh] flex flex-col relative z-10">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <span className="font-semibold text-lg">Öğrenci Seç</span>
                            <button onClick={() => setIsStudentPickerOpen(false)} className="text-gray-400 bg-gray-100 p-1 rounded-full"><div className="w-6 h-6 flex items-center justify-center">✕</div></button>
                        </div>
                        <div className="overflow-y-auto p-2">
                            {(students || []).map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => handleStudentSelect(student.id)}
                                    className="w-full text-left p-4 text-[17px] active:bg-gray-100 rounded-xl transition-colors border-b border-gray-50 last:border-0"
                                >
                                    {student.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmAction(null)}></div>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative z-10 animate-scale-in">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={28} />
                        </div>

                        <h3 className="text-xl font-bold text-center mb-2">
                            {confirmAction.type === 'delete' ? 'Dersi Sil' : 'Dersi İptal Et'}
                        </h3>

                        <p className="text-center text-gray-500 mb-6">
                            {confirmAction.type === 'delete'
                                ? 'Bu ders kalıcı olarak silinecek. Bu işlem geri alınamaz.'
                                : 'Bu ders iptal olarak işaretlenecek ve listede gri renkte görünecek.'}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold active:scale-95 transition-transform"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={confirmAction.type === 'delete' ? performDelete : performCancel}
                                className={`py-3 px-4 rounded-xl text-white font-semibold active:scale-95 transition-transform ${confirmAction.type === 'delete' ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-orange-500 shadow-lg shadow-orange-200'
                                    }`}
                            >
                                {confirmAction.type === 'delete' ? 'Sil' : 'İptal Et'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
