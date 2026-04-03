import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export const registerUser = async (email, password, username) => {
  const cred = await createUserWithEmailAndPassword(
    auth, email, password
  );
  await updateProfile(cred.user, { displayName: username });
  await sendEmailVerification(cred.user);
  return cred.user;
};

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const googleLogin = () =>
  signInWithPopup(auth, googleProvider);

export const logoutUser = () => signOut(auth);

export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email);

export const parseAuthError = (code) => {
  const map = {
    'auth/user-not-found':         'USER NOT FOUND IN DATABASE',
    'auth/wrong-password':         'INVALID CREDENTIALS',
    'auth/invalid-credential':     'INVALID CREDENTIALS',
    'auth/email-already-in-use':   'EMAIL ALREADY REGISTERED',
    'auth/weak-password':          'PASSWORD TOO WEAK — MIN 8 CHARS',
    'auth/invalid-email':          'INVALID EMAIL FORMAT',
    'auth/too-many-requests':      'TOO MANY ATTEMPTS — TRY LATER',
    'auth/popup-closed-by-user':   'GOOGLE LOGIN CANCELLED',
    'auth/network-request-failed': 'NETWORK ERROR — CHECK CONNECTION'
  };
  return map[code] || `UNKNOWN ERROR — CODE: ${code}`;
};
