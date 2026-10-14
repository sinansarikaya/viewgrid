import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { usePresence } from './usePresence';
import s from './Modal.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  className?: string;
  size?: 'default'|'wide';
  fixedHeight?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  className = '',
  size = 'default',
  fixedHeight = false,
  children,
  footer,
}) => {
  const present = usePresence(isOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    const getVisibleFocusableElements = (): HTMLElement[] => {
      if (!modalRef.current) return [];
      const candidates = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      return candidates.filter((el) => {
        if (el.hasAttribute('disabled') || (el as any).disabled) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = getVisibleFocusableElements();
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusableElements[0]!;
        const last = focusableElements[focusableElements.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first || !modalRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modalRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    const timer = window.setTimeout(() => {
      const focusable = getVisibleFocusableElements();
      if (focusable.length > 0) {
        focusable[0]!.focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 20);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.clearTimeout(timer);
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === 'function') {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen]); // Only depends on isOpen, not onClose

  if (!present) return null;

  return (
    <div className={`${s.overlay} ${!isOpen ? s.closing : ''}`} aria-hidden={!isOpen || undefined} {...(!isOpen ? { inert: '' } : {})} onClick={() => onCloseRef.current()} role="presentation">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        className={[s.modal, size==='wide'?s.wide:'', fixedHeight ? s.fixedHeight : '', className].filter(Boolean).join(' ')}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {title && (
          <div className={s.header}>
            <h2 className={s.title}>{title}</h2>
            <Button
              variant="default"
              iconOnly
              onClick={() => onCloseRef.current()}
              aria-label="Close dialog"
            >
              <Icon name="close" />
            </Button>
          </div>
        )}
        <div className={s.body}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>
  );
};
