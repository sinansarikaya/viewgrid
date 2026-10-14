import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
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
        role="status"
        aria-live="polite"
      >
        <div className={s.toastContent}>
          <span className={s.toastIcon}>
            {message.toLowerCase().includes('fail') || message.toLowerCase().includes('hata') || message.toLowerCase().includes('izin')
              ? <Icon name="alertTriangle" />
              : <Icon name="check" />}
          </span>
          <span className={s.toastMessage}>{message}</span>
          <Button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            title="Kapat"
            aria-label="Kapat"
          >
            <Icon name="close" />
          </Button>
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
