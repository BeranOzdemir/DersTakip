import React, { useState } from 'react';

export default function ProfileSetup({ onComplete, showToast }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!name.trim() || !email.trim()) {
            showToast('Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        // Save profile to localStorage
        localStorage.setItem('userProfile', JSON.stringify({ name, email }));
        localStorage.setItem('isProfileComplete', 'true');

        showToast('Profiliniz oluşturuldu!');
        onComplete();
    };

    return (
        <div className="min-h-screen bg-ios-bg flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-ios-blue text-white rounded-[2rem] mx-auto flex items-center justify-center text-5xl font-bold shadow-xl shadow-blue-200 mb-6">
                        DT
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profilinizi Oluşturun</h1>
                    <p className="text-gray-500 mt-2 text-lg">Başlamak için bilgilerinizi girin</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="border-b border-gray-300">
                            <input
                                type="text"
                                placeholder="Ad Soyad"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full py-4 px-5 text-[17px] outline-none placeholder-gray-400"
                                autoFocus
                            />
                        </div>
                        <div>
                            <input
                                type="email"
                                placeholder="E-posta"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full py-4 px-5 text-[17px] outline-none placeholder-gray-400"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-ios-blue text-white font-semibold py-4 rounded-xl text-[17px] shadow-lg shadow-blue-200 active:scale-95 transition-all"
                    >
                        Devam Et
                    </button>

                    <div className="mt-12 text-center">
                        <p className="text-xs text-gray-400">v1.0.0 • by Beran Özdemir</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
