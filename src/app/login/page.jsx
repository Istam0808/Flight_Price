'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ContactInfo from '@/components/ContactInfo/ContactInfo';
import { useAuth } from '@/hooks/useAuth';
import styles from './login.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactsOpen, setContactsOpen] = useState(false);

  useEffect(() => {
    if (!user || loading || error) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    router.push(params.get('next') || '/');
    router.refresh();
  }, [error, loading, router, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);

    await login({
      email,
      password,
      redirectTo: params.get('next') || '/',
    }).catch(() => {});
  };

  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <img src="/img/logo.png" alt="Luminara Voyage" className={styles.logo} />
        <div className={styles.header}>
          <h1 className={styles.title}>Вход в систему</h1>
          <p className={styles.subtitle}>Введите email и пароль Firebase, чтобы открыть рабочую область Luminara Voyage.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <div className={styles.contactsActions}>
          <button type="button" className={styles.contactsToggle} onClick={() => setContactsOpen(true)}>
            Контакты
          </button>
        </div>
      </section>

      {contactsOpen && (
        <div className={styles.modalOverlay} onClick={() => setContactsOpen(false)}>
          <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setContactsOpen(false)}
              aria-label="Закрыть контакты"
            >
              ×
            </button>
            <section className={styles.contactsCard}>
              <ContactInfo />
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
