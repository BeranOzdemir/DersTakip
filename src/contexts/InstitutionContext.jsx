import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    subscribeToInstitutions,
    addInstitution as addInstitutionDB,
    updateInstitution as updateInstitutionDB,
    deleteInstitution as deleteInstitutionDB
} from '../lib/db';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

const InstitutionContext = createContext(null);

export const useInstitution = () => {
    const context = useContext(InstitutionContext);
    if (!context) {
        throw new Error('useInstitution must be used within InstitutionProvider');
    }
    return context;
};

export const InstitutionProvider = ({ children }) => {
    const { currentUser, globalCash, setGlobalCash, globalTransactions, setGlobalTransactions } = useAuth();
    const [institutions, setInstitutions] = useState([]);
    const [activeInstitutionId, setActiveInstitutionId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Firestore Listener for Institutions
    useEffect(() => {
        if (!currentUser) {
            setInstitutions([]);
            setLoading(false);
            return undefined;
        }

        const unsubscribe = subscribeToInstitutions(currentUser.uid, (data) => {
            setInstitutions(data);
            setLoading(false);

            // Initialize default institution if empty
            if (data.length === 0) {
                const defaultInst = {
                    name: 'Kurumum',
                    students: [],
                    lessons: [],
                    transactions: [],
                    resources: [],
                    cash: 0
                };
                addInstitutionDB(currentUser.uid, defaultInst);
            }
        });

        return unsubscribe;
    }, [currentUser]);

    // Derived values
    const activeInstitution = institutions.find(i => i.id === activeInstitutionId) || null;
    const students = activeInstitution?.students || [];
    const lessons = activeInstitution?.lessons || [];
    const transactions = activeInstitution?.transactions || [];
    const resources = activeInstitution?.resources || [];
    const cash = activeInstitution?.cash || 0;

    // Update functions
    // ... (omitted for brevity, assume unchanged until value)

    const value = {
        institutions,
        activeInstitutionId,
        activeInstitution,
        students,
        lessons,
        setTransactions,
        setResources,
        transactions,
        resources,
        cash,
        updateActiveInstitution,
        switchInstitution,
        addInstitution,
        updateInstitution,
        deleteInstitution,
        handleResetActiveInstitution,
        handleTransferToGlobalSafe,
        handleResetGlobalSafe,
        handleWithdrawFromGlobalSafe,
        loading
    };

    return (
        <InstitutionContext.Provider value={value}>
            {children}
        </InstitutionContext.Provider>
    );
};
