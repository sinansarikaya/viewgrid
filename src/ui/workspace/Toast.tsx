import React, { useState } from 'react';
import s from './Toast.module.css';

interface Props {
  message: string | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: Props) {
  const [isPaused, setIsPaused] = useState(false);

  if (!message) return null;

  return (
    <div className={s.toastContainer}>
      <div
        className={s.toast}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="alert"
      >
        <div className={s.toastContent}>
          <span className={s.toastIcon}>
            {message.toLowerCase().includes('fail') || message.toLowerCase().includes('hata') || message.toLowerCase().includes('izin')
              ? '⚠️'
              : '✓'}
          </span>
          <span className={s.toastMessage}>{message}</span>
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            title="Kapat"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <div className={s.progressBarTrack}>
          <div
            className={`${s.progressBar} ${isPaused ? s.progressBarPaused : ''}`}
            onAnimationEnd={onClose}
          />
        </div>
      </div>
    </div>
  );
}
