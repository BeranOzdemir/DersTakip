import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useInstitution } from './contexts/InstitutionContext';
import AppLayout from './components/layout/AppLayout';
import Toast from './components/ui/Toast';
import PhotoCropper from './components/ui/PhotoCropper';
import { getAvatarColor } from './lib/avatar';
import { parseAmount, formatDateTime } from './lib/utils';
import { v4 as uuidv4 } from 'uuid';

// Lazy load page components for code splitting
const Students = lazy(() => import('./pages/Students'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Finance = lazy(() => import('./pages/Finance'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Settings = lazy(() => import('./pages/Settings'));
const InstitutionSelector = lazy(() => import('./pages/InstitutionSelector'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));

function AppContent() {
  // Get state from contexts
  const {
    currentUser,
    user,
    setUser,
    globalCash,
    setGlobalCash,
    globalTransactions,
    setGlobalTransactions,
    isAuthenticated,
    isAuthLoading,
    handleLogout
  } = useAuth();

  const {
    institutions,
    activeInstitutionId,
    activeInstitution,
    students,
    lessons,
    transactions,
    cash,
    setStudents,
    setLessons,
    setCash,
    setTransactions,
    updateActiveInstitution,
    switchInstitution,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    handleResetActiveInstitution,
    handleTransferToGlobalSafe,
    handleResetGlobalSafe,
    handleWithdrawFromGlobalSafe
  } = useInstitution();

  // UI-only state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navigationStack, setNavigationStack] = useState([]);
  const [isProfileComplete, setIsProfileComplete] = useState(() => localStorage.getItem('isProfileComplete') === 'true');

  // Instrument Picker State
  const [isInstrumentPickerOpen, setIsInstrumentPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'add' or 'edit'
  const [tempData, setTempData] = useState({}); // To store temp data for Add Student form
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Photo Crop State
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropCallback, setCropCallback] = useState(null); // Function to call with cropped base64


  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };


  const INSTRUMENTS = ['Piyano', 'Gitar', 'Keman', 'Şan', 'Bateri', 'Müzik Teorisi', 'Bağlama', 'Çello', 'Yan Flüt', 'Ud'];

  const openPicker = (target) => {
    setPickerTarget(target);
    setIsInstrumentPickerOpen(true);
  }


  const handleInstrumentSelect = (instrument) => {
    if (pickerTarget === 'add') {
      setTempData(prev => ({ ...prev, instrument }));
    } else if (pickerTarget === 'edit') {
      const input = document.getElementById('editResultInstrument');
      if (input) input.value = instrument;
    }
    setIsInstrumentPickerOpen(false);
  }

  // Handle Photo Upload (Convert to Base64 and Open Cropper)
  const handlePhotoUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Instead of immediate callback, open Cropper
        setCropImageSrc(reader.result);
        setCropCallback(() => callback); // Wrap callback in function to store in state
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow re-selecting same file
    e.target.value = '';
  };


  const navigateTo = (screen, params = {}) => {
    setNavigationStack(prev => [...prev, { screen, params }]);
  };

  const goBack = () => {
    setNavigationStack(prev => prev.slice(0, -1));
  };

  // Header Component
  // Header Component
  function GlobalHeader({ user, activeInstitution, title, rightAction, onSwitchInstitution, institutions }) {
    return (
      <div className="bg-ios-bg px-4 py-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-90 transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full ${!user?.photo && (user?.avatarColor || 'bg-gray-300')} bg-cover bg-center shadow-sm border border-white/50 overflow-hidden flex items-center justify-center`}>
            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{user?.name?.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="font-bold text-[17px] leading-tight text-gray-900">{user?.name}</div>
            <div
              onClick={() => institutions?.length > 1 && onSwitchInstitution && onSwitchInstitution()}
              className={`text-sm text-gray-500 font-medium ${institutions?.length > 1 ? 'cursor-pointer active:opacity-50 flex items-center gap-1' : ''}`}
            >
              {activeInstitution?.name}
              {institutions?.length > 1 && <Repeat size={12} />}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-end">
          <h1 className="text-[34px] font-bold tracking-tight text-gray-900 leading-none">{title}</h1>
          {rightAction && <div className="mb-1">{rightAction}</div>}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Navigation Stack Logic (Detail Pages)
    if (navigationStack.length > 0) {
      const { screen, params } = navigationStack[navigationStack.length - 1];

      if (screen === 'add-balance-modal') {
        // We want to render this ON TOP of student-detail.
        // But simple implementation replaces view.
        // To fake an overlay, we will render it INSIDE student-detail but since our structure is one view active...
        // Let's refactor: renderCurrentView returns the top-most view. 
        // IF top is modal, we also want to see the one below? 
        // Current architecture is stack-based but only renders top.
        // Quick fix: Add the modal logic INSIDE student-detail logic check.
        // And pass a prop or check stack length for >1 and top is modal.
        // BETTER: Let the 'add-balance-modal' be a transparent overlay view that imports 'student-detail' background? No too complex.
        // SIMPLEST: Render 'student-detail' normally, but check if stack has 'add-balance-modal' on top.
        // To do this, I need to know if Im 'student-detail' even if Im not top. 
        // So I will iterate stack? No.
        // Let's change how we handle this.
        // I will push 'add-balance-modal' to stack.
        // And I will add a check in renderCurrentView.
      }

      // Let's check second to last to see if we are in detail view covered by modal
      const isModalOpen = screen === 'add-balance-modal';
      const activeScreen = isModalOpen && navigationStack.length > 1 ? navigationStack[navigationStack.length - 2].screen : screen;
      const activeParams = isModalOpen && navigationStack.length > 1 ? navigationStack[navigationStack.length - 2].params : params;

      if (activeScreen === 'student-detail') {
        // Use activeParams instead of params
        const currentStudent = activeParams;
        // We need fresh data from state if possible because balance might change.
        // But params are snapshots in this simple stack.
        // Let's use name/id to find fresh student from 'students' state
        const realStudent = students.find(s => s.id === currentStudent.id) || currentStudent;

        return (
          <div className="bg-ios-bg min-h-screen animate-slide-up relative">
            {/* Modal Overlay if active */}
            {isModalOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
                <div className="bg-white w-full max-w-[320px] rounded-2xl p-6 shadow-2xl animate-scale-in">
                  <h3 className="text-xl font-bold text-center mb-2">Bakiye Ekle</h3>
                  <p className="text-center text-gray-500 mb-6 text-sm">Ne kadar eklemek istiyorsunuz?</p>

                  <div className="mb-6">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₺</span>
                      <input
                        type="number"
                        autoFocus
                        className="w-full bg-gray-100 rounded-xl py-3 pl-8 pr-4 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ios-blue/50 transition-all text-black"
                        placeholder="0"
                        id="balanceInput"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => goBack()}
                      className="bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl active:scale-95 transition-transform"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={() => {
                        const val = document.getElementById('balanceInput').value;
                        if (!val) return;

                        const amount = parseAmount(val);
                        if (amount === null) {
                          showToast('Geçerli bir tutar giriniz.', 'error');
                          return;
                        }

                        // 1. Prepare Student Update
                        const updatedStudents = (activeInstitution.students || []).map(s => s.id === realStudent.id ? { ...s, balance: s.balance + amount } : s);

                        // 2. Prepare Cash & Transaction Update
                        const { date, time } = formatDateTime();
                        const newTx = {
                          id: uuidv4(),
                          type: 'wallet_load',
                          description: `Cüzdan Yükleme: ${realStudent.name}`,
                          amount: amount,
                          date: date,
                          time: time
                        };

                        const newCash = (activeInstitution.cash || 0) + amount;
                        const newTransactions = [newTx, ...(activeInstitution.transactions || [])];

                        // 3. Atomic Update
                        updateActiveInstitution({
                          students: updatedStudents,
                          cash: newCash,
                          transactions: newTransactions
                        });

                        // Update local UI optimistic via setStudents
                        setStudents(updatedStudents);
                        showToast(`${amount}₺ tahsilat eklendi.`);

                        // Close Modal
                        setNavigationStack(prev => {
                          const newStack = [...prev];
                          newStack.pop(); // Remove modal
                          // Update the param of the detail view to reflect new balance visually immediately
                          if (newStack.length > 0) {
                            newStack[newStack.length - 1].params = { ...realStudent, balance: realStudent.balance + amount };
                          }
                          return newStack;
                        });
                      }}
                      className="bg-ios-blue text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform shadow-lg shadow-blue-200"
                    >
                      Onayla
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 flex items-center gap-2 mb-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-ios-separator pt-safe-top transition-all">
              <button onClick={goBack} className="text-ios-blue flex items-center text-[17px] active:opacity-50 pl-0">
                <span className="text-3xl items-center flex mr-1 pb-1">‹</span> Tüm Öğrenciler
              </button>
              <span className="font-semibold absolute left-1/2 -translate-x-1/2 opacity-0 animate-fade-in sm:opacity-100">{realStudent.name}</span>
              <button
                onClick={() => navigateTo('edit-student', realStudent)}
                className="text-ios-blue text-[17px] absolute right-4 active:opacity-50 font-normal"
              >
                Düzenle
              </button>
            </div>
            <div className="p-4 pt-0 pb-32">
              <div className="flex flex-col items-center mb-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-2 shadow-lg overflow-hidden ${!realStudent.photo ? getAvatarColor(realStudent.name) : 'bg-white'}`}>
                  {realStudent.photo ? (
                    <img src={realStudent.photo} alt={realStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    realStudent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  )}
                </div>
                <h2 className="text-2xl font-bold">{params.name}</h2>
                <p className="text-ios-subtext text-lg mb-4">{params.instrument}</p>
                <button
                  onClick={() => navigateTo('add-balance-modal', params)}
                  className="bg-ios-blue/10 text-ios-blue px-6 py-2 rounded-full font-semibold text-sm active:bg-ios-blue/20 transition-colors"
                >
                  + Para Ekle
                </button>
              </div>

              <div className="bg-ios-card rounded-xl shadow-ios overflow-hidden mb-6">
                <div className="p-4 border-b border-ios-separator flex justify-between items-center active:bg-gray-50">
                  <a href={`tel:${realStudent.phone}`} className="text-ios-blue text-right">{realStudent.phone}</a>
                </div>
                <div className="p-4 border-b border-ios-separator flex justify-between items-center active:bg-gray-50">
                  <span className="text-ios-text">Ders Ücreti</span>
                  <span className="text-gray-900">{realStudent.feePerLesson}₺</span>
                </div>
                <div className="p-4 flex justify-between items-center border-b border-ios-separator">
                  <span className="text-ios-text">Bakiye</span>
                  <span className={realStudent.balance !== 0 ? (realStudent.balance > 0 ? "text-ios-green" : "text-ios-red") : "text-ios-subtext"}>
                    {realStudent.balance}₺
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center active:bg-gray-50">
                  <span className="text-ios-text">Geçmiş Dersler</span>
                  {/* <span className="text-ios-subtext text-sm">❯</span> */}
                </div>
                <div className="divide-y divide-ios-separator bg-gray-50">
                  {(() => {
                    const history = lessons
                      .filter(l => l.studentId === realStudent.id && (l.status === 'completed' || l.status === 'cancelled'))
                      .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
                      .slice(0, 3);

                    if (history.length === 0) {
                      return <div className="p-4 text-center text-gray-400 text-sm">Geçmiş ders kaydı yok.</div>;
                    }

                    return history.map(lesson => (
                      <div key={lesson.id} className="p-4">
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold">{new Date(lesson.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${lesson.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {lesson.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{lesson.topic || 'Konu girilmedi'}</p>
                      </div>
                    ));
                  })()}
                  <button
                    onClick={() => navigateTo('history', realStudent)}
                    className="w-full p-4 text-center text-sm text-ios-blue font-medium active:opacity-50"
                  >
                    Tümünü Gör
                  </button>
                </div>
              </div>

              {/* Add Balance Modal */}
              {activeTab === 'add-balance-modal' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
                  <div className="bg-white w-full max-w-[320px] rounded-2xl p-6 shadow-2xl animate-slide-up">
                    <h3 className="text-xl font-bold text-center mb-2">Bakiye Ekle</h3>
                    <p className="text-center text-gray-500 mb-6 text-sm">Ne kadar eklemek istiyorsunuz?</p>

                    <div className="mb-6">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₺</span>
                        <input
                          type="number"
                          autoFocus
                          className="w-full bg-gray-100 rounded-xl py-3 pl-8 pr-4 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ios-blue/50 transition-all"
                          placeholder="0"
                          id="balanceInput"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          // Close modal (hacky state use of activeTab for modal trigger here)
                          setActiveTab('dashboard'); // Actually we want to stay on detail but just close modal.
                          // Need a better way to check modal open state or use another state var. 
                          // Re-using activeTab is risky if we want to return to student-detail.
                          // Let's use a local variable inside AppContent if possible or just use a specific string for modal
                          const newStack = [...navigationStack];
                          newStack.pop(); // Remove modal from stack if we pushed it, or just use state.
                          // Since I can't easily add new state variables without replacing the whole component, 
                          // I will implement the modal as an overlay inside the student-detail view block controlled by a local variable if I could, 
                          // but I can't easily add lines to top of component.
                          // ALTERNATIVE: Use a query param in navigation?
                          // Let's stick to the plan: The modal is part of the detail view render.
                          // I will add a piece of state by replacing the top of component in next step if needed. 
                          // For now, let's assume I can add a sub-view state or just use nav stack.

                          // Using nav stack for modal 'add-balance'
                          setNavigationStack(prev => prev.slice(0, -1));
                        }}
                        className="bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl active:scale-95 transition-transform"
                      >
                        Vazgeç
                      </button>
                      <button
                        onClick={() => {
                          const val = document.getElementById('balanceInput').value;
                          if (!val) return;

                          const amount = parseAmount(val);
                          if (amount === null) {
                            showToast('Geçerli bir tutar giriniz.', 'error');
                            return;
                          }

                          // 1. Prepare Student Update
                          const updatedStudents = (activeInstitution.students || []).map(s => s.id === params.id ? { ...s, balance: s.balance + amount } : s);

                          // 2. Prepare Cash & Transaction Update
                          const { date, time } = formatDateTime();
                          const newTx = {
                            id: uuidv4(),
                            type: 'wallet_load',
                            description: `Cüzdan Yükleme: ${params.name}`,
                            amount: amount,
                            date: date,
                            time: time
                          };

                          const newCash = (activeInstitution.cash || 0) + amount;
                          const newTransactions = [newTx, ...(activeInstitution.transactions || [])];

                          // 3. Atomic Update
                          updateActiveInstitution({
                            students: updatedStudents,
                            cash: newCash,
                            transactions: newTransactions
                          });

                          // Update local UI optimistic via params
                          setStudents(updatedStudents); // Keep local state sync just in case, though listener will overwrite
                          showToast(`${amount}₺ tahsilat eklendi.`);

                          // Update params in stack to show new balance immediately
                          const updatedParam = { ...params, balance: params.balance + amount };
                          // Update the 'student-detail' screen in stack (which is below the modal)
                          setNavigationStack(prev => {
                            const newStack = [...prev];
                            newStack.pop();
                            newStack[newStack.length - 1].params = updatedParam;
                            return newStack;
                          });
                        }}
                        className="bg-ios-blue text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform shadow-lg shadow-blue-200"
                      >
                        Onayla
                      </button>
                    </div>
                  </div>
                </div>
              )}



              <div className="min-h-[20px]"></div>
            </div>
          </div>
        );
      }

      if (screen === 'add-student') {
        return (
          <div className="bg-ios-bg min-h-screen pt-safe-top animate-slide-up">
            <div className="p-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-ios-separator sticky top-0 z-10">
              <button onClick={() => { setTempData({}); goBack(); }} className="text-ios-blue text-[17px] active:opacity-50">Vazgeç</button>
              <span className="font-semibold">Yeni Öğrenci</span>
              <button onClick={() => {
                // Save New Student Logic
                const name = document.getElementById('addName').value;
                const fee = document.getElementById('addFee').value;
                const phone = document.getElementById('addPhone').value;
                const instrument = tempData.instrument; // from generic state

                const newStudent = {
                  id: Date.now(),
                  name: name || 'Yeni Öğrenci',
                  instrument: instrument || 'Piyano',
                  balance: 0,
                  feePerLesson: parseInt(fee) || 0,
                  phone: phone || '',
                  photo: tempData.photo || null,
                  avatarColor: getAvatarColor(name || 'Y')
                };
                setStudents(prev => [...prev, newStudent]);
                setTempData({});
                showToast('Yeni öğrenci eklendi!');
                goBack();
              }} className="text-ios-blue font-bold text-[17px] active:opacity-50">Ekle</button>
            </div>
            <div className="p-4">
              <div className="bg-ios-card rounded-xl shadow-ios overflow-hidden divide-y divide-ios-separator">
                <div className="px-4 py-3 flex justify-center">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white overflow-hidden ${!tempData.photo ? 'bg-gray-300' : 'bg-white'}`}>
                      {tempData.photo ? (
                        <img src={tempData.photo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>foto</span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-[-5px] bg-ios-blue text-white rounded-full p-1.5 shadow-md cursor-pointer active:scale-95 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, (base64) => setTempData(prev => ({ ...prev, photo: base64 })))} />
                    </label>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <input id="addName" type="text" placeholder="Ad Soyad" className="w-full bg-transparent focus:outline-none text-[17px] py-1" autoFocus />
                </div>
                <div className="px-4 py-3 relative" onClick={() => openPicker('add')}>
                  <div className={`text-[17px] py-1 ${tempData.instrument ? 'text-black' : 'text-gray-400'}`}>
                    {tempData.instrument || 'Enstrüman Seçiniz'}
                  </div>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
                </div>
                <div className="px-4 py-3">
                  <input id="addFee" type="number" placeholder="Ders Ücreti (₺)" className="w-full bg-transparent focus:outline-none text-[17px] py-1" />
                </div>
                <div className="px-4 py-3">
                  <input id="addPhone" type="tel" placeholder="Telefon Numarası" className="w-full bg-transparent focus:outline-none text-[17px] py-1" />
                </div>
              </div>
            </div>
          </div>
        )
      }

      if (screen === 'edit-student') {
        return (
          <div className="bg-ios-bg min-h-screen pt-safe-top animate-slide-up">
            <div className="p-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-ios-separator sticky top-0 z-10">
              <button onClick={goBack} className="text-ios-blue text-[17px] active:opacity-50">Vazgeç</button>
              <span className="font-semibold">Düzenle</span>
              <button onClick={() => {
                const newName = document.getElementById('editResultName').value;
                const newInstrument = document.getElementById('editResultInstrument').value;
                const newFee = document.getElementById('editResultFee').value;
                const newPhone = document.getElementById('editResultPhone').value;
                const newPhoto = tempData.editPhoto || params.photo; // Use new if exists, else old

                const updatedStudent = { ...params, name: newName, instrument: newInstrument, feePerLesson: parseInt(newFee), phone: newPhone, photo: newPhoto };

                const updatedList = students.map(s => s.id === params.id ? updatedStudent : s);
                setStudents(updatedList);

                // Update navigation stack so when we go back, the detail page has new info
                setNavigationStack(prev => {
                  const newStack = [...prev];
                  newStack.pop(); // Remove edit screen
                  // Update the detail screen below it
                  if (newStack.length > 0) {
                    newStack[newStack.length - 1].params = updatedStudent;
                  }
                  return newStack;
                });
                showToast('Değişiklikler kaydedildi!');

              }} className="text-ios-blue font-bold text-[17px] active:opacity-50">Kaydet</button>
            </div>
            <div className="p-4">
              <div className="bg-ios-card rounded-xl shadow-ios overflow-hidden divide-y divide-ios-separator">
                <div className="px-4 py-3 flex justify-center">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white overflow-hidden ${!params.photo && !tempData.editPhoto ? getAvatarColor(params.name) : 'bg-white'}`}>
                      {tempData.editPhoto || params.photo ? (
                        <img src={tempData.editPhoto || params.photo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        params.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <label className="absolute bottom-0 right-[-5px] bg-ios-blue text-white rounded-full p-1.5 shadow-md cursor-pointer active:scale-95 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, (base64) => setTempData(prev => ({ ...prev, editPhoto: base64 })))} />
                    </label>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <label className="text-xs text-ios-subtext uppercase font-semibold">Ad Soyad</label>
                  <input id="editResultName" defaultValue={params.name} className="w-full bg-transparent focus:outline-none text-[17px] py-1" />
                </div>
                <div className="px-4 py-3 relative" onClick={() => openPicker('edit')}>
                  <label className="text-xs text-ios-subtext uppercase font-semibold">Enstrüman</label>
                  <input id="editResultInstrument" defaultValue={params.instrument} readOnly className="w-full bg-transparent focus:outline-none text-[17px] py-1 pointer-events-none" />
                  <span className="absolute right-8 mt-[-26px] text-gray-400 pointer-events-none">▼</span>
                </div>
                <div className="px-4 py-3">
                  <label className="text-xs text-ios-subtext uppercase font-semibold">Ders Ücreti</label>
                  <input id="editResultFee" defaultValue={params.feePerLesson} type="number" className="w-full bg-transparent focus:outline-none text-[17px] py-1" />
                </div>
                <div className="px-4 py-3">
                  <label className="text-xs text-ios-subtext uppercase font-semibold">Telefon</label>
                  <input id="editResultPhone" defaultValue={params.phone} type="tel" className="w-full bg-transparent focus:outline-none text-[17px] py-1" />
                </div>
              </div>

              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="w-full bg-white text-ios-red font-semibold py-3 rounded-xl shadow-ios active:bg-gray-50 mt-6 mb-8"
              >
                Öğrenciyi Sil
              </button>
            </div>
          </div >
        )
      }

      if (screen === 'history') {
        const student = params;
        const historyLessons = lessons
          .filter(l => l.studentId === student.id && (l.status === 'completed' || l.status === 'cancelled'))
          .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

        return (
          <div className="bg-ios-bg min-h-screen pt-safe-top animate-slide-up">
            <div className="p-4 flex items-center gap-2 bg-white/80 backdrop-blur-md border-b border-ios-separator sticky top-0 z-10">
              <button onClick={goBack} className="text-ios-blue text-[17px] active:opacity-50 flex items-center pl-0">
                <span className="text-3xl items-center flex mr-1 pb-1">‹</span> {student.name}
              </button>
              <span className="font-semibold absolute left-1/2 -translate-x-1/2">Ders Geçmişi</span>
            </div>
            <div className="p-4">
              {historyLessons.length > 0 ? (
                <div className="bg-ios-card rounded-xl shadow-ios divide-y divide-ios-separator">
                  {historyLessons.map(lesson => (
                    <div key={lesson.id} className="p-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">
                          {new Date(lesson.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${lesson.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {lesson.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-800 mt-1">
                        <span>{lesson.time}</span>
                        <span className="text-gray-500 truncate max-w-[150px]">{lesson.topic || 'Konu girilmedi'}</span>
                      </div>
                      {lesson.homework && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                          <span className="font-semibold">Ödev:</span> {lesson.homework}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 mt-10">
                  Henüz geçmiş ders kaydı yok.
                </div>
              )}
            </div>
          </div>
        );
      }
    }



    // Tab Views
    if (activeTab === 'dashboard') return (
      <Dashboard showToast={showToast} />
    );
    if (activeTab === 'students') return <Students onNavigate={navigateTo} />;
    if (activeTab === 'schedule') return <Schedule showToast={showToast} onNavigate={navigateTo} />;
    if (activeTab === 'finance') return (
      <Finance
        showToast={showToast}
        onTransferToGlobalSafe={handleTransferToGlobalSafe}
      />
    );
    if (activeTab === 'settings') return (
      <Settings
        showToast={showToast}
        onPhotoUpload={handlePhotoUpload}
      />
    );

    return <div>Sayfa Bulunamadı</div>;
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ios-bg">
        <div className="w-8 h-8 border-4 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-ios-bg">
            <div className="w-8 h-8 border-4 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Login onLogin={() => { }} showToast={showToast} />
        </Suspense>
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      </>
    );
  }

  if (!isProfileComplete) {
    return (
      <>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-ios-bg">
            <div className="w-8 h-8 border-4 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <ProfileSetup onComplete={() => setIsProfileComplete(true)} showToast={showToast} />
        </Suspense>
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      </>
    );
  }

  // 4. Selector Screen (Default if no active institution)
  if (!activeInstitutionId) {
    return (
      <>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-ios-bg">
            <div className="w-8 h-8 border-4 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <InstitutionSelector
            showToast={showToast}
            onResetGlobalSafe={handleResetGlobalSafe}
            onWithdrawFromGlobalSafe={handleWithdrawFromGlobalSafe}
          />
        </Suspense>
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      </>
    );
  }

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setNavigationStack([]);
        }}
        hideTabBar={navigationStack.length > 0}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          {renderContent()}
        </Suspense>
      </AppLayout>

      {/* Instrument Picker Action Sheet */}
      {isInstrumentPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto"
            onClick={() => setIsInstrumentPickerOpen(false)}
          ></div>

          {/* Sheet */}
          <div className="bg-white w-full sm:w-[320px] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up pointer-events-auto max-h-[70vh] flex flex-col relative z-10">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-lg">Enstrüman Seç</span>
              <button onClick={() => setIsInstrumentPickerOpen(false)} className="text-gray-400 bg-gray-100 p-1 rounded-full"><div className="w-6 h-6 flex items-center justify-center">✕</div></button>
            </div>
            <div className="overflow-y-auto p-2">
              {INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => handleInstrumentSelect(inst)}
                  className="w-full text-left p-4 text-[17px] active:bg-gray-100 rounded-xl transition-colors border-b border-gray-50 last:border-0"
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photo Cropper Overlay */}
      {cropImageSrc && (
        <PhotoCropper
          imageSrc={cropImageSrc}
          onCancel={() => {
            setCropImageSrc(null);
            setCropCallback(null);
          }}
          onCropComplete={(base64) => {
            if (cropCallback) cropCallback(base64);
            setCropImageSrc(null);
            setCropCallback(null);
          }}
        />
      )}

      {/* Delete Confirmation Action Sheet */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={() => setIsDeleteConfirmOpen(false)}></div>
          <div className="bg-transparent w-full sm:w-[320px] pointer-events-auto p-4 z-10 flex flex-col gap-2 animate-slide-up">
            <div className="bg-white/90 backdrop-blur rounded-xl overflow-hidden">
              <div className="p-4 text-center border-b border-gray-300/50">
                <h3 className="text-sm font-semibold text-gray-500">Bu öğrenciyi silmek istediğinize emin misiniz?</h3>
                <p className="text-xs text-gray-400 mt-1">Bu işlem geri alınamaz.</p>
              </div>
              <button
                onClick={() => {
                  // Delete Logic
                  // Access params from navigation stack directly since we are 'above' the edit screen technically in rendering order but this is global state
                  // However, params is local in render function. We can save 'studentToDelete' state or just assume top of stack is target.
                  // The edit screen is open, so stack top is 'edit-student'.
                  const currentParams = navigationStack[navigationStack.length - 1]?.params;
                  if (currentParams) {
                    const updated = students.filter(s => s.id !== currentParams.id);
                    setStudents(updated);
                    showToast('Öğrenci silindi', 'error');
                    setNavigationStack([]); // Go home
                  }
                  setIsDeleteConfirmOpen(false);
                }}
                className="w-full py-3.5 text-[17px] font-semibold text-ios-red active:bg-gray-100 transition-colors"
              >
                Öğrenciyi Sil
              </button>
            </div>
            <button
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="bg-white w-full py-3.5 rounded-xl font-semibold text-[17px] text-ios-blue shadow-lg active:scale-95 transition-transform"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* Global Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </>
  );
}

export default AppContent;
