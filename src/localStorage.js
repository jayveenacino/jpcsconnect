const STORAGE_KEYS = {
    EVENTS: 'jpcs_events',
    USERS: 'jpcs_users',
    ATTENDANCE: 'jpcs_attendance',
    ANNOUNCEMENTS: 'jpcs_announcements'
};

const initializeStorage = () => {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify([]));
    }
};

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getDocs = async (collectionName) => {
    initializeStorage();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const key = STORAGE_KEYS[collectionName.toUpperCase()];
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    return {
        docs: data.map(item => ({
            id: item.id,
            data: () => item
        })),
        size: data.length
    };
};

export const addDoc = async (collectionName, docData) => {
    initializeStorage();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const key = STORAGE_KEYS[collectionName.toUpperCase()];
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    const newDoc = {
        id: generateId(),
        ...docData,
        createdAt: new Date().toISOString()
    };
    
    data.push(newDoc);
    localStorage.setItem(key, JSON.stringify(data));
    
    return { id: newDoc.id };
};

export const updateDoc = async (collectionName, docId, updates) => {
    initializeStorage();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const key = STORAGE_KEYS[collectionName.toUpperCase()];
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    const index = data.findIndex(item => item.id === docId);
    if (index !== -1) {
        data[index] = { ...data[index], ...updates };
        localStorage.setItem(key, JSON.stringify(data));
    }
};

export const deleteDoc = async (collectionName, docId) => {
    initializeStorage();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const key = STORAGE_KEYS[collectionName.toUpperCase()];
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    const filtered = data.filter(item => item.id !== docId);
    localStorage.setItem(key, JSON.stringify(filtered));
};

export const setDoc = async (collectionName, docId, docData) => {
    initializeStorage();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const key = STORAGE_KEYS[collectionName.toUpperCase()];
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    const index = data.findIndex(item => item.id === docId);
    const newDoc = { id: docId, ...docData };
    
    if (index !== -1) {
        data[index] = newDoc;
    } else {
        data.push(newDoc);
    }
    
    localStorage.setItem(key, JSON.stringify(data));
};

export const queryWhere = async (collectionName, field, operator, value) => {
    initializeStorage();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const key = STORAGE_KEYS[collectionName.toUpperCase()];
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    let filtered = data;
    
    if (operator === '==') {
        filtered = data.filter(item => item[field] === value);
    } else if (operator === '!=') {
        filtered = data.filter(item => item[field] !== value);
    } else if (operator === '>') {
        filtered = data.filter(item => item[field] > value);
    } else if (operator === '<') {
        filtered = data.filter(item => item[field] < value);
    }
    
    return {
        docs: filtered.map(item => ({
            id: item.id,
            data: () => item
        })),
        empty: filtered.length === 0
    };
};

export const queryOrderLimit = async (collectionName, orderField, direction = 'asc', limitCount = null) => {
    initializeStorage();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const key = STORAGE_KEYS[collectionName.toUpperCase()];
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    const sorted = [...data].sort((a, b) => {
        const aVal = a[orderField];
        const bVal = b[orderField];
        
        if (direction === 'desc') {
            return aVal < bVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
    });
    
    const limited = limitCount ? sorted.slice(0, limitCount) : sorted;
    
    return {
        docs: limited.map(item => ({
            id: item.id,
            data: () => item
        }))
    };
};

export const updateStudentAttendance = async (oldStudentId, newStudentData) => {
    initializeStorage();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const key = STORAGE_KEYS.ATTENDANCE;
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    let updated = false;
    const updatedData = data.map(record => {
        if (record.studentId === oldStudentId) {
            updated = true;
            return {
                ...record,
                studentId: newStudentData.studentId || oldStudentId,
                studentName: newStudentData.displayName || record.studentName
            };
        }
        return record;
    });
    
    if (updated) {
        localStorage.setItem(key, JSON.stringify(updatedData));
    }
    
    return updated;
};

export default {
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    queryWhere,
    queryOrderLimit,
    updateStudentAttendance
};
