import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { isGuest as checkGuest } from '../services/storageService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, loading] = useAuthState(auth);
  // Re-evaluate guest mode reactively so changes from Login page are reflected
  const [guestMode, setGuestMode] = useState(checkGuest());

  useEffect(() => {
    // Poll guest mode so navigation back to protected routes picks it up
    setGuestMode(checkGuest());
  }, [firebaseUser]);

  // If guest mode is set, we don't need to wait for Firebase
  const effectiveLoading = loading && !guestMode;

  const value = {
    user:        firebaseUser,
    isGuest:     !firebaseUser && guestMode,
    isAuthed:    !!firebaseUser,
    isLoggedIn:  !!firebaseUser || guestMode,
    loading:     effectiveLoading,
    displayName: firebaseUser?.displayName
                 || (guestMode ? 'GUEST_USER' : null),
    email:       firebaseUser?.email || null,
    refreshGuest: () => setGuestMode(checkGuest()),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
