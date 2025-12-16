import { db } from './firebase';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    getDoc,
    getDocs
} from 'firebase/firestore';

// Collection References
const getUsersRef = () => collection(db, 'users');
const getInstitutionsRef = (userId) => collection(db, `users/${userId}/institutions`);

// --- Users ---

export const initializeUser = async (user) => {
    try {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        // Create if not exists, update login time
        await setDoc(userRef, {
            email: user.email,
            lastLogin: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error initializing user:', error);
        throw error;
    }
};

export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            return snap.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

export const updateUserProfile = async (userId, data) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

export const deleteUserData = async (userId) => {
    try {
        // Delete all institutions first
        const institutionsRef = getInstitutionsRef(userId);
        const snapshot = await getDocs(institutionsRef);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Delete user document
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
    } catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
};

// --- Institutions ---

// Real-time listener for user's institutions
export const subscribeToInstitutions = (userId, callback) => {
    try {
        const q = query(getInstitutionsRef(userId), orderBy('createdAt', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(data);
        }, (error) => {
            console.error('Error in institutions subscription:', error);
        });
    } catch (error) {
        console.error('Error subscribing to institutions:', error);
        throw error;
    }
};

export const addInstitution = async (userId, institution) => {
    try {
        const ref = await addDoc(getInstitutionsRef(userId), {
            ...institution,
            createdAt: new Date().toISOString()
        });
        return ref.id;
    } catch (error) {
        console.error('Error adding institution:', error);
        throw error;
    }
};

// Renaming the exported update function to be clear
export const updateInstitution = async (userId, institutionId, data) => {
    try {
        const ref = doc(db, `users/${userId}/institutions/${institutionId}`);
        await updateDoc(ref, data);
    } catch (error) {
        console.error('Error updating institution:', error);
        throw error;
    }
};

export const deleteInstitution = async (userId, institutionId) => {
    try {
        const ref = doc(db, `users/${userId}/institutions/${institutionId}`);
        await deleteDoc(ref);
    } catch (error) {
        console.error('Error deleting institution:', error);
        throw error;
    }
};
