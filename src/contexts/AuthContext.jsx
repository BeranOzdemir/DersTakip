import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
    initializeUser,
    getUserProfile,
    updateUserProfile,
    deleteUserData
} from '../lib/db';
import { useDebounce } from '../lib/utils';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [user, setUser] = useState({
        name: 'Kullanıcı',
        email: '',
        avatarColor: 'bg-ios-blue',
        photo: null
    });
    const [globalCash, setGlobalCash] = useState(0);
    const [globalTransactions, setGlobalTransactions] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isUserLoadedFromDB, setIsUserLoadedFromDB] = useState(false);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setCurrentUser(firebaseUser);
            setIsAuthenticated(!!firebaseUser);

            if (firebaseUser) {
                try {
                    await initializeUser(firebaseUser);
                    const profile = await getUserProfile(firebaseUser.uid);

                    if (profile) {
                        setUser(prev => ({
                            ...prev,
                            name: profile.name || prev.name,
                            email: firebaseUser.email,
                            photo: profile.photo || null
                        }));
                        setGlobalCash(profile.globalCash || 0);
                        setGlobalTransactions(profile.globalTransactions || []);
                    } else {
                        setUser(prev => ({ ...prev, email: firebaseUser.email }));
                    }
                    setIsUserLoadedFromDB(true);
                } catch (error) {
                    console.error('Error loading user data:', error);
                    setUser(prev => ({ ...prev, email: firebaseUser.email }));
                    setIsUserLoadedFromDB(true);
                }
            }
            setIsAuthLoading(false);
        });

        return unsubscribe;
    }, []);

    // Debounced profile sync
    const debouncedUpdateProfile = useDebounce((uid, data) => {
        updateUserProfile(uid, data).catch(error => {
            console.error('Failed to update user profile:', error);
        });
    }, 500);

    useEffect(() => {
        if (currentUser && isUserLoadedFromDB) {
            debouncedUpdateProfile(currentUser.uid, {
                name: user.name,
                photo: user.photo,
                globalCash: globalCash,
                globalTransactions: globalTransactions
            });
        }
    }, [user.name, user.photo, globalCash, globalTransactions, currentUser, isUserLoadedFromDB, debouncedUpdateProfile]);

    const handleLogout = async () => {
        await signOut(auth);
        setUser({ name: 'Kullanıcı', email: '', avatarColor: 'bg-ios-blue', photo: null });
        setIsUserLoadedFromDB(false);
    };

    const handleDeleteAccount = async () => {
        if (!currentUser) return;

        try {
            // 1. Delete all Firestore data
            await deleteUserData(currentUser.uid);

            // 2. Delete Firebase Authentication account
            await deleteUser(currentUser);

            // 3. Reset state
            setUser({ name: 'Kullanıcı', email: '', avatarColor: 'bg-ios-blue', photo: null });
            setGlobalCash(0);
            setGlobalTransactions([]);
            setIsUserLoadedFromDB(false);
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    };

    const value = {
        currentUser,
        user,
        setUser,
        globalCash,
        setGlobalCash,
        globalTransactions,
        setGlobalTransactions,
        isAuthenticated,
        isAuthLoading,
        isUserLoadedFromDB,
        handleLogout,
        handleDeleteAccount
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
