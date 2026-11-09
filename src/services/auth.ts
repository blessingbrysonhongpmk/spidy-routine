import { UserProfile } from '@/types';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getAppSetting, setAppSetting } from './database';

// Firebase configuration placeholder - user can replace with their project credentials
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDummyKeyForLocalDevelopmentAndTesting',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'spidey-flow-dev.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'spidey-flow-dev',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'spidey-flow-dev.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
};

// Initialize Firebase App safely
let authInstance: any = null;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);
} catch (e) {
  console.warn('Firebase initialization warning (running in offline/local mode):', e);
}
export const auth = authInstance;

// Default clean blank profile for new installs
export const BLANK_USER: UserProfile = {
  uid: 'agent_local',
  name: '',
  email: '',
  callsign: '',
  heroArchetype: 'spiderman',
  dailyTarget: 5,
  motto: '',
  isGuest: true,
};

export async function getPersistedUser(): Promise<UserProfile> {
  try {
    const raw = await getAppSetting('user_profile', '');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...BLANK_USER,
        ...parsed,
      };
    }
  } catch {
    // Ignore JSON parse errors
  }
  return BLANK_USER;
}

export async function persistUser(user: UserProfile): Promise<void> {
  await setAppSetting('user_profile', JSON.stringify(user));
  await setAppSetting('user_name', user.name || '');
  if (user.callsign) {
    await setAppSetting('user_callsign', user.callsign);
  }
  if (user.heroArchetype) {
    await setAppSetting('hero_archetype', user.heroArchetype);
  }
}

export async function updateUserProfile(details: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getPersistedUser();
  const updated: UserProfile = {
    ...current,
    ...details,
  };
  await persistUser(updated);
  return updated;
}

export async function resetUserProfileToBlank(): Promise<UserProfile> {
  await persistUser(BLANK_USER);
  return BLANK_USER;
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (!auth) {
    const user: UserProfile = {
      uid: 'user_' + Date.now(),
      name: email.split('@')[0],
      email: email,
      isGuest: false,
    };
    await persistUser(user);
    return user;
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user: UserProfile = {
      uid: cred.user.uid,
      name: cred.user.displayName || email.split('@')[0],
      email: cred.user.email || email,
      photoURL: cred.user.photoURL || undefined,
      isGuest: false,
    };
    await persistUser(user);
    return user;
  } catch (error: any) {
    // If running in development without live backend, gracefully allow simulated login
    if (error.code === 'auth/invalid-api-key' || error.code === 'auth/network-request-failed') {
      const user: UserProfile = {
        uid: 'user_' + Date.now(),
        name: email.split('@')[0],
        email: email,
        isGuest: false,
      };
      await persistUser(user);
      return user;
    }
    throw error;
  }
}

export async function registerWithEmail(
  name: string,
  email: string,
  pass: string
): Promise<UserProfile> {
  if (!auth) {
    const user: UserProfile = {
      uid: 'user_' + Date.now(),
      name: name,
      email: email,
      isGuest: false,
    };
    await persistUser(user);
    return user;
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
    const user: UserProfile = {
      uid: cred.user.uid,
      name: name,
      email: cred.user.email || email,
      isGuest: false,
    };
    await persistUser(user);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/invalid-api-key' || error.code === 'auth/network-request-failed') {
      const user: UserProfile = {
        uid: 'user_' + Date.now(),
        name: name,
        email: email,
        isGuest: false,
      };
      await persistUser(user);
      return user;
    }
    throw error;
  }
}

export async function loginWithGoogleSimulated(googleName: string, googleEmail: string): Promise<UserProfile> {
  const user: UserProfile = {
    uid: 'google_' + Date.now(),
    name: googleName || 'Hero Operative',
    email: googleEmail || 'operative@gmail.com',
    isGuest: false,
  };
  await persistUser(user);
  return user;
}

export async function logoutUser(): Promise<void> {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch {
    // Offline or guest mode
  }
  // Reset persisted user to default guest mode without touching database tasks/routines!
  await persistUser(BLANK_USER);
}
