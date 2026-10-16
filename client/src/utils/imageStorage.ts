// client/src/utils/imageStorage.ts

const DB_NAME = 'goal_tracker_images_db';
const STORE_NAME = 'vision_images';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVisionImage(goalId: string, base64Data: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(base64Data, goalId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent('vision-image-updated', { detail: { goalId } }));
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save image to IndexedDB, fallback to localStorage', err);
    try {
      localStorage.setItem(`vision_img_${goalId}`, base64Data);
      window.dispatchEvent(new CustomEvent('vision-image-updated', { detail: { goalId } }));
    } catch {
      // quota exceeded
    }
  }
}

export async function getVisionImage(goalId: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(goalId);
    return new Promise((resolve) => {
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result);
        } else {
          resolve(localStorage.getItem(`vision_img_${goalId}`));
        }
      };
      req.onerror = () => resolve(localStorage.getItem(`vision_img_${goalId}`));
    });
  } catch {
    return localStorage.getItem(`vision_img_${goalId}`);
  }
}

export async function deleteVisionImage(goalId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(goalId);
  } catch {
    // ignore
  }
  localStorage.removeItem(`vision_img_${goalId}`);
  window.dispatchEvent(new CustomEvent('vision-image-updated', { detail: { goalId } }));
}
