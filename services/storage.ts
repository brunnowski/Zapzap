
import { Message } from '../types';

const DB_NAME = 'ChatMemoryDB';
const DB_VERSION = 1;
const STORE_MESSAGES = 'messages';
const STORE_MEDIA = 'media';
const STORE_META = 'metadata';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA);
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
  });
};

export const saveChatToDisk = async (messages: Message[], partnerName: string) => {
  const db = await initDB();
  const tx = db.transaction([STORE_MESSAGES, STORE_META], 'readwrite');
  
  // Clear old messages first
  tx.objectStore(STORE_MESSAGES).clear();
  messages.forEach(msg => tx.objectStore(STORE_MESSAGES).put(msg));
  
  tx.objectStore(STORE_META).put(partnerName, 'partnerName');
  tx.objectStore(STORE_META).put(new Date(), 'lastUpdated');
  
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true);
  });
};

export const saveMediaToDisk = async (mediaMap: Map<string, File>) => {
  const db = await initDB();
  const tx = db.transaction(STORE_MEDIA, 'readwrite');
  const store = tx.objectStore(STORE_MEDIA);
  
  for (const [name, file] of mediaMap.entries()) {
    store.put(file, name);
  }
  
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true);
  });
};

export const loadChatFromDisk = async (): Promise<{ messages: Message[], partnerName: string, mediaMap: Map<string, File> } | null> => {
  const db = await initDB();
  
  const messages: Message[] = await new Promise((resolve) => {
    const tx = db.transaction(STORE_MESSAGES, 'readonly');
    const request = tx.objectStore(STORE_MESSAGES).getAll();
    request.onsuccess = () => resolve(request.result);
  });

  if (messages.length === 0) return null;

  const partnerName: string = await new Promise((resolve) => {
    const tx = db.transaction(STORE_META, 'readonly');
    const request = tx.objectStore(STORE_META).get('partnerName');
    request.onsuccess = () => resolve(request.result || 'Brunno Rossetti');
  });

  const mediaMap = new Map<string, File>();
  await new Promise((resolve) => {
    const tx = db.transaction(STORE_MEDIA, 'readonly');
    const store = tx.objectStore(STORE_MEDIA);
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        mediaMap.set(cursor.key as string, cursor.value as File);
        cursor.continue();
      } else {
        resolve(true);
      }
    };
  });

  return { messages, partnerName, mediaMap };
};

export const clearAllData = async () => {
  const db = await initDB();
  const tx = db.transaction([STORE_MESSAGES, STORE_MEDIA, STORE_META], 'readwrite');
  tx.objectStore(STORE_MESSAGES).clear();
  tx.objectStore(STORE_MEDIA).clear();
  tx.objectStore(STORE_META).clear();
  return new Promise(resolve => tx.oncomplete = () => resolve(true));
};
