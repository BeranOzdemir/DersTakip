importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// ⚠️ ÖNEMLİ: Aşağıdaki bilgileri kendi Firebase Config bilgilerinizle doldurunuz.
// Bu bilgiler .env dosyasından çekilemez çünkü Service Worker ayrı bir thread'de çalışır.
// Firebase Console -> Project Settings -> General kısmından alabilirsiniz.

const firebaseConfig = {
    apiKey: "API_KEY_BURAYA",
    authDomain: "derstakip-1033.firebaseapp.com",
    projectId: "derstakip-1033",
    storageBucket: "derstakip-1033.appspot.com",
    messagingSenderId: "MESSAGING_SENDER_ID_BURAYA",
    appId: "APP_ID_BURAYA"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Arka plan bildirimi alındı:', payload);
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/vite.svg'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.log('Firebase SW Error:', e);
}
