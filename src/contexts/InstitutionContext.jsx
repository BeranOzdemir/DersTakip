import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    subscribeToInstitutions,
    addInstitution as addInstitutionDB,
    updateInstitution as updateInstitutionDB,
    deleteInstitution as deleteInstitutionDB
} from '../lib/db';
import { useAuth } from './AuthContext';

const InstitutionContext = createContext(null);

export const useInstitution = () => {
    const context = useContext(InstitutionContext);
    if (!context) {
        throw new Error('useInstitution must be used within InstitutionProvider');
    }
    return context;
};

export const InstitutionProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [institutions, setInstitutions] = useState([]);
    const [activeInstitutionId, setActiveInstitutionId] = useState(null);

    // Firestore Listener for Institutions
    useEffect(() => {
        if (!currentUser) {
            setInstitutions([]);
            return undefined;
        }

        const unsubscribe = subscribeToInstitutions(currentUser.uid, (data) => {
            setInstitutions(data);

            // Initialize default institution if empty
            if (data.length === 0) {
                const defaultInst = {
                    name: 'Kurumum',
                    students: [],
                    lessons: [],
                    transactions: [],
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
    const cash = activeInstitution?.cash || 0;

    // Update functions
    const setStudents = (updaterOrValue) => {
        if (!currentUser || !activeInstitutionId) return;

        const newStudents = typeof updaterOrValue === 'function'
            ? updaterOrValue(students)
            : updaterOrValue;

        updateInstitutionDB(currentUser.uid, activeInstitutionId, { students: newStudents });
    };

    const setLessons = (updaterOrValue) => {
        if (!currentUser || !activeInstitutionId) return;

        const newLessons = typeof updaterOrValue === 'function'
            ? updaterOrValue(lessons)
            : updaterOrValue;

        updateInstitutionDB(currentUser.uid, activeInstitutionId, { lessons: newLessons });
    };

    const setCash = (updaterOrValue) => {
        if (!currentUser || !activeInstitutionId) return;

        const newCash = typeof updaterOrValue === 'function'
            ? updaterOrValue(cash)
            : updaterOrValue;

        updateInstitutionDB(currentUser.uid, activeInstitutionId, { cash: newCash });
    };

    const setTransactions = (updaterOrValue) => {
        if (!currentUser || !activeInstitutionId) return;

        const newTransactions = typeof updaterOrValue === 'function'
            ? updaterOrValue(transactions)
            : updaterOrValue;

        updateInstitutionDB(currentUser.uid, activeInstitutionId, { transactions: newTransactions });
    };

    const updateActiveInstitution = (updates) => {
        if (!currentUser || !activeInstitutionId) return;
        updateInstitutionDB(currentUser.uid, activeInstitutionId, updates);
    };

    const switchInstitution = (id) => {
        setActiveInstitutionId(id);
    };

    const addInstitution = async (name, photo = null) => {
        if (!currentUser) return;

        const newInst = {
            name,
            photo,
            students: [],
            lessons: [],
            transactions: [],
            cash: 0
        };

        await addInstitutionDB(currentUser.uid, newInst);
    };

    const updateInstitution = (id, updates) => {
        if (!currentUser) return;
        updateInstitutionDB(currentUser.uid, id, updates);
    };

    const deleteInstitution = async (id) => {
        if (!currentUser) return;

        await deleteInstitutionDB(currentUser.uid, id);

        // Switch to another institution if current one is deleted
        if (activeInstitutionId === id) {
            const remaining = institutions.filter(i => i.id !== id);
            setActiveInstitutionId(remaining.length > 0 ? remaining[0].id : null);
        }
    };

    const handleResetActiveInstitution = () => {
        if (!activeInstitution) return;

        updateActiveInstitution({
            students: [],
            lessons: [],
            transactions: [],
            cash: 0
        });
    };

    const value = {
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
        handleResetActiveInstitution
    };

    return (
        <InstitutionContext.Provider value={value}>
            {children}
        </InstitutionContext.Provider>
    );
};
