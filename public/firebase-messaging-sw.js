importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDArbCxlkoMz6rhB4Yxo91TrE9-3dEs1do",
    authDomain: "derstakip-1033.firebaseapp.com",
    projectId: "derstakip-1033",
    storageBucket: "derstakip-1033.firebasestorage.app",
    messagingSenderId: "1000782326910",
    appId: "1:1000782326910:web:2f869b1e2f1d4a361efc2f"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Arka plan bildirimi alındı:', payload);

        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/vite.svg', // Uygulama ikonu
            badge: '/vite.svg'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.error('Firebase messaging SW initialization failed:', e);
}
