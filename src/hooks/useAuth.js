import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseClientAuth } from '@/lib/firebase/client';

async function parseSessionResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Auth request failed: ${response.status}`);
  }

  return data;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const manualLoginRef = useRef(false);

  useEffect(() => {
    const auth = getFirebaseClientAuth();

    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      if (manualLoginRef.current) {
        setLoading(false);
        return;
      }

      try {
        const currentSession = await fetch('/api/auth/session');

        if (currentSession.ok) {
          const data = await currentSession.json();

          if (data.authenticated) {
            setLoading(false);
            return;
          }
        }

        const idToken = await firebaseUser.getIdToken();

        await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        }).then(parseSessionResponse);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const login = useCallback(async ({ email, password, redirectTo = '/' }) => {
    setError('');
    setLoading(true);
    manualLoginRef.current = true;
    const auth = getFirebaseClientAuth();

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      }).then(parseSessionResponse);

      window.location.assign(redirectTo);
    } catch (err) {
      await signOut(auth).catch(() => {});
      setUser(null);
      setError(err.message);
      throw err;
    } finally {
      manualLoginRef.current = false;
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      await fetch('/api/auth/session', { method: 'DELETE' }).then(parseSessionResponse);
      await signOut(getFirebaseClientAuth());
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  return {
    user,
    loading,
    error,
    login,
    logout,
  };
}
