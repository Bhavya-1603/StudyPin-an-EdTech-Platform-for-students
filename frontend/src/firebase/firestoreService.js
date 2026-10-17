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
  arrayUnion,
  arrayRemove,
  increment,
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
  console.error('Firestore Error: ', JSON.stringify(errInfo))
  throw new Error(JSON.stringify(errInfo))
}

// 1. Fetch Categorized Notes from Firestore
export async function fetchCategorizedNotesFromFirestore(category = 'All') {
  if (!db) return []
  const path = 'notes'
  try {
    let q = collection(db, path)
    if (category && category !== 'All') {
      q = query(q, where('category', '==', category))
    }
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ ...d.data(), id: d.id, _firestore: true }))
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path)
    return []
  }
}

// 2. Real-time Subscription to Categorized Notes from Firestore
export function subscribeCategorizedNotesFromFirestore(category = 'All', callback, onError) {
  if (!db) {
    if (callback) callback([])
    return () => {}
  }
  const path = 'notes'
  try {
    let q = collection(db, path)
    if (category && category !== 'All') {
      q = query(q, where('category', '==', category))
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const notes = snapshot.docs.map((d) => ({ ...d.data(), id: d.id, _firestore: true }))
        if (callback) callback(notes)
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, path)
        } catch (e) {
          if (onError) onError(e)
        }
      }
    )
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path)
    return () => {}
  }
}

// 3. Fetch User Profile & Saved Pin IDs from Firestore
export async function fetchUserSavedPinsFromFirestore(userId) {
  if (!db || !userId) return { savedNoteIds: [], savedNotes: [] }
  const path = `users/${userId}`
  try {
    const userDocRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userDocRef)

    if (!userSnap.exists()) {
      return { savedNoteIds: [], savedNotes: [] }
    }

    const userData = userSnap.data()
    const savedNoteIds = Array.isArray(userData.savedNoteIds) ? userData.savedNoteIds : []

    if (savedNoteIds.length === 0) {
      return { savedNoteIds: [], savedNotes: [] }
    }

    // Fetch individual note documents from Firestore
    const notePromises = savedNoteIds.map(async (noteId) => {
      try {
        const noteSnap = await getDoc(doc(db, 'notes', noteId))
        if (noteSnap.exists()) {
          return { ...noteSnap.data(), id: noteSnap.id, _firestore: true }
        }
      } catch {
        // Individual note fetch error handled gracefully
      }
      return null
    })

    const resolvedNotes = (await Promise.all(notePromises)).filter(Boolean)
    return { savedNoteIds, savedNotes: resolvedNotes }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path)
    return { savedNoteIds: [], savedNotes: [] }
  }
}

// 4. Real-time Subscription to User's Saved Pin IDs
export function subscribeUserSavedPins(userId, callback, onError) {
  if (!db || !userId) {
    if (callback) callback([])
    return () => {}
  }
  const path = `users/${userId}`
  try {
    return onSnapshot(
      doc(db, 'users', userId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          callback(Array.isArray(data.savedNoteIds) ? data.savedNoteIds : [])
        } else {
          callback([])
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, path)
        } catch (e) {
          if (onError) onError(e)
        }
      }
    )
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path)
    return () => {}
  }
}

// 5. Toggle Pin / Save in Firestore
export async function toggleSavePinInFirestore(userId, note, shouldSave = true, userEmail = '') {
  if (!db || !userId || !note?.id) return false
  const userPath = `users/${userId}`
  const notePath = `notes/${note.id}`

  try {
    // 1. Ensure user doc exists or update savedNoteIds
    const userRef = doc(db, 'users', userId)
    await setDoc(
      userRef,
      {
        id: userId,
        email: userEmail || auth?.currentUser?.email || '',
        savedNoteIds: shouldSave ? arrayUnion(note.id) : arrayRemove(note.id),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    // 2. Also ensure the note itself exists in Firestore notes collection
    const noteRef = doc(db, 'notes', note.id)
    const noteSnap = await getDoc(noteRef)
    if (!noteSnap.exists()) {
      await setDoc(noteRef, {
        id: note.id,
        title: note.title || 'Study Pin',
        description: note.description || '',
        category: note.category || 'Science',
        subject: note.subject || 'General Study',
        tags: Array.isArray(note.tags) ? note.tags : [],
        file_url: note.file_url || '#',
        thumbnail: note.thumbnail || '',
        uploader: note.uploader || 'Student',
        uploaderId: note.uploaderId || userId,
        likes: Number(note.likes) || 1,
        saves: shouldSave ? 1 : 0,
        views: Number(note.views) || 10,
        difficulty: note.difficulty || 'Medium',
        createdAt: new Date().toISOString(),
      })
    } else {
      // Update saves count
      await updateDoc(noteRef, {
        saves: increment(shouldSave ? 1 : -1),
        updatedAt: new Date().toISOString(),
      }).catch(() => {})
    }

    return true
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath)
    return false
  }
}

// 6. Sync Newly Uploaded Note directly to Firestore
export async function saveNoteToFirestore(note) {
  if (!db || !note?.id) return false
  const path = `notes/${note.id}`
  try {
    await setDoc(doc(db, 'notes', note.id), {
      ...note,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path)
    return false
  }
}

// 7. Sync User Profile to Firestore
export async function syncUserToFirestore(userData) {
  if (!db || !userData?.id) return false
  const path = `users/${userData.id}`
  try {
    await setDoc(
      doc(db, 'users', userData.id),
      {
        id: userData.id,
        name: userData.name || userData.displayName || 'Student',
        email: userData.email || '',
        streak: userData.streak || 1,
        savedNoteIds: userData.savedNoteIds || [],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
    return true
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path)
    return false
  }
}

// 8. Fetch User's Curated Boards from Firestore
export async function fetchUserBoardsFromFirestore(userId) {
  if (!db || !userId) return []
  const path = 'boards'
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }))
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path)
    return []
  }
}

// 9. Create Board in Firestore
export async function createBoardInFirestore(userId, boardData) {
  if (!db || !userId) return null
  const boardId = 'board-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
  const path = `boards/${boardId}`
  try {
    const newBoard = {
      id: boardId,
      ownerId: userId,
      title: boardData.title,
      description: boardData.description || '',
      category: boardData.category || 'General',
      noteIds: Array.isArray(boardData.noteIds) ? boardData.noteIds : [],
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'boards', boardId), newBoard)
    return newBoard
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path)
    return null
  }
}
