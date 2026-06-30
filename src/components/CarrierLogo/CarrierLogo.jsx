'use client';

import { useState } from 'react';
import styles from './CarrierLogo.module.scss';

function getInitials(code, name) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (normalizedCode.length >= 2) {
    return normalizedCode.slice(0, 2);
  }

  const normalizedName = String(name || '').trim();
  if (normalizedName.length >= 2) {
    return normalizedName.slice(0, 2).toUpperCase();
  }

  return '—';
}

export default function CarrierLogo({ logo, name, code, size = 36 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(logo) && !imageFailed;
  const initials = getInitials(code, name);

  if (showImage) {
    return (
      <span className={styles.wrap} style={{ width: size, height: size }}>
        <img
          src={logo}
          alt=""
          width={size}
          height={size}
          className={styles.image}
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={styles.fallback}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
