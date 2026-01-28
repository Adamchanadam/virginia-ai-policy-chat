
import { UploadedFile, ChatThread } from '../types';
import { MAX_SAVED_THREADS } from '../constants';

const DB_NAME = 'VirginiaAiDB';
const FILE_STORE = 'files';
const CHAT_STORE = 'chats';
const DB_VERSION = 2; // Incremented version for new store

// Helper to open the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(CHAT_STORE)) {
        const chatStore = db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
        chatStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- File Operations ---

export const saveFileToDB = async (file: UploadedFile): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE, 'readwrite');
    const store = transaction.objectStore(FILE_STORE);
    store.put(file);

    // CRITICAL FIX: Wait for transaction to complete, not just request success
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const removeFileFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE, 'readwrite');
    const store = transaction.objectStore(FILE_STORE);
    store.delete(id);

    // CRITICAL FIX: Wait for transaction to complete
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllFilesFromDB = async (): Promise<UploadedFile[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE, 'readonly');
    const store = transaction.objectStore(FILE_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as UploadedFile[]);
    request.onerror = () => reject(request.error);
  });
};

// --- Chat Thread Operations ---

export const saveThreadToDB = async (thread: ChatThread): Promise<void> => {
  const db = await openDB();
  
  // 1. Save the new/updated thread
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(CHAT_STORE, 'readwrite');
    const store = transaction.objectStore(CHAT_STORE);
    store.put(thread);
    
    // CRITICAL FIX: Wait for transaction to complete
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  // 2. Enforce limit (Keep only latest 5)
  // We do this in a separate transaction to keep logic simple
  const allThreads = await getAllThreadsFromDB();
  if (allThreads.length > MAX_SAVED_THREADS) {
    // Sort by updatedAt descending
    allThreads.sort((a, b) => b.updatedAt - a.updatedAt);
    
    // Identify threads to delete
    const threadsToDelete = allThreads.slice(MAX_SAVED_THREADS);
    
    // Start a new transaction for deletion
    const dbDelete = await openDB(); // Re-open or reuse connection
    const transaction = dbDelete.transaction(CHAT_STORE, 'readwrite');
    const store = transaction.objectStore(CHAT_STORE);
    
    threadsToDelete.forEach(t => {
      store.delete(t.id);
    });
  }
};

export const deleteThreadFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHAT_STORE, 'readwrite');
    const store = transaction.objectStore(CHAT_STORE);
    store.delete(id);

    // CRITICAL FIX: Wait for transaction to complete
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllThreadsFromDB = async (): Promise<ChatThread[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHAT_STORE, 'readonly');
    const store = transaction.objectStore(CHAT_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
        const threads = request.result as ChatThread[];
        // Return sorted by updatedAt desc
        threads.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(threads);
    };
    request.onerror = () => reject(request.error);
  });
};
