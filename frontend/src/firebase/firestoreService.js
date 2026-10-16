import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore'
import { db, auth } from './firebase'

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
}

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  }
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo))
  return errInfo
}

// Initial Boot Connection Test
export async function validateFirestoreConnection() {
  if (!db) return false
  try {
    await getDocFromServer(doc(db, 'test', 'connection'))
    return true
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration.')
    }
    return false
  }
}

// 1. Sync User Profile in Firestore
export async function syncUserToFirestore(userData) {
  if (!db || !userData?.id) return
  const path = `users/${userData.id}`
  try {
    await setDoc(
      doc(db, 'users', userData.id),
      {
        id: userData.id,
        name: userData.name || 'Student',
        email: userData.email || '',
        streak: userData.streak || 1,
        savedNoteIds: userData.savedNoteIds || [],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path)
  }
}

// 2. Sync Pinned Note to Firestore
export async function saveNoteToFirestore(note) {
  if (!db || !note?.id) return
  const path = `notes/${note.id}`
  try {
    await setDoc(doc(db, 'notes', note.id), {
      ...note,
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path)
  }
}

// 3. Fetch Notes from Firestore with Category Filter
export async function fetchNotesFromFirestore(category = '') {
  if (!db) return []
  const path = 'notes'
  try {
    let q = collection(db, path)
    if (category && category !== 'All') {
      q = query(q, where('category', '==', category))
    }
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }))
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path)
    return []
  }
}

// Run connection validation on import
validateFirestoreConnection().catch(() => {})
