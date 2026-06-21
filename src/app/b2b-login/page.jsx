'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../login/login.module.scss';

function getSafeRedirectPath() {
  const params = new URLSearchParams(window.location.search);
  const nextPath = params.get('next') || '/';

  if (!nextPath.startsWith('/') || nextPath.startsWith('//') || nextPath.toLowerCase() === '/b2b-login') {
    return '/';
  }

  return nextPath;
}

export default function B2BLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function checkB2BSession() {
      try {
        const response = await fetch('/api/auth/status', {
          credentials: 'include',
        });
        const data = await response.json().catch(() => ({}));

        if (cancelled) {
          return;
        }

        if (response.ok && data.authenticated) {
          router.replace(getSafeRedirectPath());
          router.refresh();
          return;
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    checkB2BSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось войти в B2B');
      }

      router.push(getSafeRedirectPath());
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <img src="/img/logo.png" alt="Luminara Voyage" className={styles.logo} />
        <div className={styles.header}>
          <h1 className={styles.title}>Вход в B2B</h1>
          <p className={styles.subtitle}>Введите данные B2B, чтобы cookie token сохранился автоматически.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Логин</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitButton} disabled={loading || checkingSession}>
            {checkingSession ? 'Проверяем вход...' : loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <a className={styles.backLink} href="/">
          Вернуться на главную
        </a>
      </section>
    </main>
  );
}
