import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

const ADMIN_EMAIL = 'srijithsrivathsa37@gmail.com';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  streetCred: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveUserToFirestore(fbUser: FirebaseUser): Promise<AuthUser> {
  const userDocRef = doc(db, 'users', fbUser.uid);
  const existing = await getDoc(userDocRef);

  const isAdmin = fbUser.email === ADMIN_EMAIL;

  const userData: AuthUser = {
    uid: fbUser.uid,
    name: fbUser.displayName || 'Anonymous',
    email: fbUser.email || '',
    avatar: fbUser.photoURL || '',
    isAdmin,
    streetCred: 0,
  };

  if (!existing.exists()) {
    await setDoc(userDocRef, {
      uid: userData.uid,
      name: userData.name,
      email: userData.email,
      photoURL: userData.avatar,
      isAdmin,
      streetCred: 0,
      createdAt: serverTimestamp(),
    });
  } else {
    const existingData = existing.data();
    await setDoc(
      userDocRef,
      {
        name: userData.name,
        email: userData.email,
        photoURL: userData.avatar,
        isAdmin,
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );
    userData.streetCred = existingData?.streetCred || 0;
  }

  return userData;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('civicsnap_user');
      if (cached) setUser(JSON.parse(cached));
    } catch { /* ignore */ }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const savedUser = await saveUserToFirestore(fbUser);
          setUser(savedUser);
          localStorage.setItem('civicsnap_user', JSON.stringify(savedUser));
        } catch {
          const fallback: AuthUser = {
            uid: fbUser.uid,
            name: fbUser.displayName || 'Anonymous',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || '',
            isAdmin: fbUser.email === ADMIN_EMAIL,
            streetCred: 0,
          };
          setUser(fallback);
          localStorage.setItem('civicsnap_user', JSON.stringify(fallback));
        }
      } else {
        setUser(null);
        localStorage.removeItem('civicsnap_user');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setLoading(false);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('civicsnap_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
