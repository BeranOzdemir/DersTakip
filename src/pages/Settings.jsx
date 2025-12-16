import React, { useState, useRef } from 'react';
import { ChevronRight, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInstitution } from '../contexts/InstitutionContext';

export default function Settings({ showToast, onPhotoUpload }) {
    const { user, setUser, handleLogout: onLogout } = useAuth();
    const { institutions, activeInstitution, addInstitution, updateInstitution, deleteInstitution, switchInstitution, handleResetActiveInstitution: onResetActiveInstitution } = useInstitution();

    const fileInputRef = useRef(null);

    const [modalType, setModalType] = useState(null); // 'name' | 'password' | 'addInstitution' | 'editInstitution' | 'deleteConfirm' | 'resetDataConfirm' | null
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [selectedInstitution, setSelectedInstitution] = useState(null);

    const handleSaveName = () => {
        const newName = document.getElementById('editNameInput').value;
        if (newName.trim()) {
            const updatedUser = { ...user, name: newName };
            setUser(updatedUser);
            // Ensure photo is preserved
            localStorage.setItem('userProfile', JSON.stringify(updatedUser)); // Keep local sync just in case
            showToast('Kullanıcı adı güncellendi.');
            setModalType(null);
        }
    };

    const handleChangePassword = () => {
        const currentPass = document.getElementById('currentPass').value;
        const newPass = document.getElementById('newPass').value;
        const confirmPass = document.getElementById('confirmPass').value;

        if (!currentPass || !newPass || !confirmPass) {
            showToast('Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        if (newPass !== confirmPass) {
            showToast('Yeni şifreler eşleşmiyor.', 'error');
            return;
        }

        // Mock Logic
        if (currentPass === '123456') { // Mock check
            showToast('Eski şifre hatalı (Demo: hepsi kabul ediliyor).', 'warning');
            // In real app we would return here. 
            // But for demo let's allow it or just fake success
        }

        showToast('Şifreniz başarıyla değiştirildi.');
        setModalType(null);
    };

    return (
        <div className="pb-20 animate-fade-in relative z-0">
            {/* Header */}
            <h1 className="text-[34px] font-bold tracking-tight mb-6 px-4">Ayarlar</h1>

            {/* Profile Card */}
            <div className="px-4 mb-8">
                <div className="bg-ios-card p-4 rounded-xl shadow-ios flex items-center gap-4">
                    <div className="relative">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-16 h-16 ${!user.photo && user.avatarColor || 'bg-gray-200'} text-white rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden cursor-pointer active:opacity-80 transition-opacity`}
                        >
                            {user.photo ? (
                                <img src={user.photo} alt="Profil" className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0)
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md border border-gray-100"
                        >
                            <Camera size={12} className="text-ios-blue" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => onPhotoUpload(e, (base64) => {
                                const updatedUser = { ...user, photo: base64 };
                                setUser(updatedUser);
                                showToast('Profil fotoğrafı güncellendi.');
                            })}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Account Settings */}
            <h2 className="text-ios-subtext uppercase text-[13px] mb-2 ml-8">HESAP AYARLARI</h2>
            <div className="px-4 mb-6">
                <div className="bg-ios-card rounded-xl shadow-ios overflow-hidden divide-y divide-gray-100">
                    <button
                        onClick={() => setModalType('name')}
                        className="w-full p-4 flex justify-between items-center active:bg-gray-50 transition-colors"
                    >
                        <span className="text-[17px]">Ad Soyad Değiştir</span>
                        <ChevronRight size={20} className="text-gray-300" />
                    </button>
                    <button
                        onClick={() => setModalType('password')}
                        className="w-full p-4 flex justify-between items-center active:bg-gray-50 transition-colors"
                    >
                        <span className="text-[17px]">Şifre Değiştir</span>
                        <ChevronRight size={20} className="text-gray-300" />
                    </button>
                </div>
            </div>

            {/* Institutions */}
            {institutions && institutions.length > 0 && (
                <>
                    <h2 className="text-ios-subtext uppercase text-[13px] mb-2 ml-8">KURUMLAR</h2>
                    <div className="px-4 mb-6">
                        <div className="bg-ios-card rounded-xl shadow-ios overflow-hidden divide-y divide-gray-100">
                            {institutions.map(inst => (
                                <div key={inst.id} className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[17px]">{inst.name}</span>
                                        {inst.id === activeInstitution?.id && (
                                            <span className="text-xs bg-blue-100 text-ios-blue px-2 py-0.5 rounded font-semibold">Aktif</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedInstitution(inst);
                                                setModalType('editInstitution');
                                            }}
                                            className="text-ios-blue text-sm active:opacity-50"
                                        >
                                            Düzenle
                                        </button>
                                        {institutions.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    setSelectedInstitution(inst);
                                                    setModalType('deleteConfirm');
                                                }}
                                                className="text-ios-red text-sm active:opacity-50"
                                            >
                                                Sil
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    setSelectedInstitution({ photo: null }); // Reset for new photo
                                    setModalType('addInstitution');
                                }}
                                className="w-full p-4 text-ios-blue font-semibold text-[17px] active:bg-gray-50 transition-colors"
                            >
                                + Kurum Ekle
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* General Settings */}
            <h2 className="text-ios-subtext uppercase text-[13px] mb-2 ml-8">GENEL</h2>
            <div className="px-4 mb-6">
                <div className="bg-ios-card rounded-xl shadow-ios overflow-hidden">
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-[17px]">Bildirimler</span>
                        <button
                            onClick={() => {
                                setNotificationsEnabled(!notificationsEnabled);
                                showToast(notificationsEnabled ? 'Bildirimler kapatıldı' : 'Bildirimler açıldı');
                            }}
                            className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ${notificationsEnabled ? 'bg-ios-green' : 'bg-gray-300'
                                }`}
                        >
                            <div className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform duration-200 ${notificationsEnabled ? 'translate-x-[20px]' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Data */}
            {activeInstitution && (
                <>
                    <h2 className="text-ios-subtext uppercase text-[13px] mb-2 ml-8">TEHLİKELİ BÖLGE</h2>
                    <div className="px-4 mb-6">
                        <button
                            onClick={() => setModalType('resetDataConfirm')}
                            className="w-full bg-white text-orange-600 py-3.5 rounded-xl font-semibold shadow-ios active:scale-95 transition-transform text-[17px] border border-orange-200"
                        >
                            Tüm Verileri Sıfırla
                        </button>
                    </div>
                </>
            )}

            {/* Logout */}
            <h2 className="text-ios-subtext uppercase text-[13px] mb-2 ml-8">OTURUM</h2>
            <div className="px-4">
                <button
                    onClick={() => {
                        localStorage.removeItem('isAuthenticated');
                        onLogout();
                    }}
                    className="w-full bg-white text-ios-red py-3.5 rounded-xl font-semibold shadow-ios active:scale-95 transition-transform text-[17px]"
                >
                    Çıkış Yap
                </button>
            </div>

            <div className="mt-10 text-center text-xs text-gray-400">
                v1.0.0 • by Beran Özdemir
            </div>

            {/* Modals */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalType(null)}></div>
                    <div className="bg-white w-full max-w-[320px] rounded-2xl p-6 shadow-2xl animate-scale-in relative z-10">

                        {/* Edit Name Modal */}
                        {modalType === 'name' && (
                            <>
                                <h3 className="text-xl font-bold text-center mb-4">Adı Düzenle</h3>
                                <input
                                    id="editNameInput"
                                    type="text"
                                    defaultValue={user.name}
                                    className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[17px] mb-6 focus:outline-none focus:ring-2 focus:ring-ios-blue/50"
                                    placeholder="Ad Soyad"
                                    autoFocus
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setModalType(null)} className="bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl">Vazgeç</button>
                                    <button onClick={handleSaveName} className="bg-ios-blue text-white font-semibold py-3 rounded-xl">Kaydet</button>
                                </div>
                            </>
                        )}

                        {/* Change Password Modal */}
                        {modalType === 'password' && (
                            <>
                                <h3 className="text-xl font-bold text-center mb-4">Şifre Değiştir</h3>
                                <div className="space-y-3 mb-6">
                                    <input id="currentPass" type="password" placeholder="Mevcut Şifre" className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[17px] focus:outline-none" />
                                    <input id="newPass" type="password" placeholder="Yeni Şifre" className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[17px] focus:outline-none" />
                                    <input id="confirmPass" type="password" placeholder="Yeni Şifre (Tekrar)" className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[17px] focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setModalType(null)} className="bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl">Vazgeç</button>
                                    <button onClick={handleChangePassword} className="bg-ios-blue text-white font-semibold py-3 rounded-xl">Güncelle</button>
                                </div>
                            </>
                        )}

                        {/* Add Institution Modal */}
                        {modalType === 'addInstitution' && (
                            <>
                                <h3 className="text-xl font-bold text-center mb-4">Kurum Ekle</h3>
                                <div className="flex justify-center mb-4">
                                    <div className="relative">
                                        <div className={`w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300`}>
                                            {selectedInstitution?.photo ? ( // Re-using selectedInstitution state for temporary photo holding
                                                <img src={selectedInstitution.photo} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera className="text-gray-400" size={32} />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setSelectedInstitution(prev => ({ ...prev, photo: reader.result }));
                                                    }
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <input
                                    id="newInstitutionName"
                                    type="text"
                                    className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[17px] mb-6 focus:outline-none focus:ring-2 focus:ring-ios-blue/50"
                                    placeholder="Kurum Adı"
                                    autoFocus
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setModalType(null)} className="bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl">Vazgeç</button>
                                    <button onClick={() => {
                                        const name = document.getElementById('newInstitutionName').value;
                                        if (name.trim()) {
                                            addInstitution(name, selectedInstitution?.photo);
                                            setModalType(null);
                                        } else {
                                            showToast('Lütfen kurum adı girin.', 'error');
                                        }
                                    }} className="bg-ios-blue text-white font-semibold py-3 rounded-xl">Ekle</button>
                                </div>
                            </>
                        )}

                        {/* Edit Institution Modal */}
                        {modalType === 'editInstitution' && selectedInstitution && (
                            <>
                                <h3 className="text-xl font-bold text-center mb-4">Kurum Düzenle</h3>
                                <div className="flex justify-center mb-4">
                                    <div className="relative">
                                        <div className={`w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300`}>
                                            {selectedInstitution.photo ? (
                                                <img src={selectedInstitution.photo} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera className="text-gray-400" size={32} />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setSelectedInstitution(prev => ({ ...prev, photo: reader.result }));
                                                    }
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <input
                                    id="editInstitutionName"
                                    type="text"
                                    defaultValue={selectedInstitution.name}
                                    className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[17px] mb-6 focus:outline-none focus:ring-2 focus:ring-ios-blue/50"
                                    placeholder="Kurum Adı"
                                    autoFocus
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setModalType(null)} className="bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl">Vazgeç</button>
                                    <button onClick={() => {
                                        const name = document.getElementById('editInstitutionName').value;
                                        if (name.trim()) {
                                            updateInstitution(selectedInstitution.id, { name, photo: selectedInstitution.photo });
                                            showToast('Kurum güncellendi.');
                                            setModalType(null);
                                        }
                                    }} className="bg-ios-blue text-white font-semibold py-3 rounded-xl">Kaydet</button>
                                </div>
                            </>
                        )}

                        {/* Delete Confirmation Modal */}
                        {modalType === 'deleteConfirm' && selectedInstitution && (
                            <>
                                <h3 className="text-xl font-bold text-center mb-2">Kurumu Sil</h3>
                                <p className="text-center text-gray-500 mb-6">
                                    <strong>{selectedInstitution.name}</strong> kurumunu silmek istediğinize emin misiniz?
                                    <br /><span className="text-xs">Bu işlem geri alınamaz.</span>
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setModalType(null)} className="bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl">Vazgeç</button>
                                    <button onClick={() => {
                                        deleteInstitution(selectedInstitution.id);
                                        setModalType(null);
                                    }} className="bg-ios-red text-white font-semibold py-3 rounded-xl">Sil</button>
                                </div>
                            </>
                        )}

                        {/* Reset Data Confirmation Modal */}
                        {modalType === 'resetDataConfirm' && activeInstitution && (
                            <>
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-3xl">⚠️</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-orange-600 mb-2">Tüm Verileri Sil</h3>
                                    <p className="text-gray-600 text-sm">
                                        <strong>{activeInstitution.name}</strong> kurumunun <strong>tüm öğrencileri, dersleri, işlem geçmişi ve kasa bakiyesi</strong> silinecek.
                                    </p>
                                    <p className="text-xs text-ios-red mt-2 font-semibold">
                                        ⚠️ Bu işlem geri alınamaz!
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setModalType(null)} className="bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl">Vazgeç</button>
                                    <button onClick={() => {
                                        if (onResetActiveInstitution) {
                                            onResetActiveInstitution();
                                        }
                                        setModalType(null);
                                    }} className="bg-orange-600 text-white font-semibold py-3 rounded-xl">Sıfırla</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
