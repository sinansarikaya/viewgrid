import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import s from './Tooltip.module.css';
import { useGeometryClass } from './useGeometryClass';

export interface TooltipProps {
  content?: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom';
  disabled?: boolean;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  disabled = false,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const geometry = useGeometryClass({ '--vg-tooltip-top': coords.top, '--vg-tooltip-left': coords.left });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const id = useId();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const focused = useRef(false);
  const tooltipHovered = useRef(false);
  const triggerHovered = useRef(false);
  const clearHide = useCallback(() => { clearTimeout(hideTimer.current); }, []);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 120;
    const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 24;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(8, Math.min(window.innerWidth - tooltipWidth - 8, left));

    let top = placement === 'top' ? rect.top - tooltipHeight - 6 : rect.bottom + 6;
    if (top < 8) {
      top = rect.bottom + 6;
    } else if (top + tooltipHeight > window.innerHeight - 8) {
      top = rect.top - tooltipHeight - 6;
    }

    setCoords({ top, left });
  }, [placement]);

  const show = useCallback(() => {
    clearHide();
    if (disabled || !content) return;
    setVisible(true);
  }, [disabled, content, clearHide]);

  const hide = useCallback(() => {
    clearHide();
    tooltipHovered.current = false;
    setVisible(false);
  }, [clearHide]);
  const deferHide = useCallback(() => {
    clearHide();
    hideTimer.current = setTimeout(() => {
      if (!focused.current && !tooltipHovered.current && !triggerHovered.current) hide();
    }, 150);
  }, [clearHide, hide]);

  useEffect(() => {
    if (visible) {
      updatePosition();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') hide();
      };
      const handleScroll = () => {
        updatePosition();
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [visible, updatePosition, hide]);

  if (!content || disabled) {
    return children;
  }

  const childProps = children.props as Record<string, unknown>;

  const trigger = React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const originalRef = (children as any).ref;
      if (typeof originalRef === 'function') {
        originalRef(node);
      } else if (originalRef && typeof originalRef === 'object') {
        originalRef.current = node;
      }
    },
    'aria-describedby': [childProps['aria-describedby'], visible ? id : undefined].filter(Boolean).join(' ') || undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      triggerHovered.current = true;
      show();
      if (typeof childProps.onMouseEnter === 'function') {
        (childProps.onMouseEnter as (e: React.MouseEvent) => void)(e);
      }
    },
    onClick: (e: React.MouseEvent) => {
      hide();
      if (typeof childProps.onClick === 'function') (childProps.onClick as (event: React.MouseEvent) => void)(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      triggerHovered.current = false;
      deferHide();
      if (typeof childProps.onMouseLeave === 'function') {
        (childProps.onMouseLeave as (e: React.MouseEvent) => void)(e);
      }
    },
    onFocus: (e: React.FocusEvent) => {
      focused.current = true;
      show();
      if (typeof childProps.onFocus === 'function') {
        (childProps.onFocus as (e: React.FocusEvent) => void)(e);
      }
    },
    onBlur: (e: React.FocusEvent) => {
      focused.current = false;
      deferHide();
      if (typeof childProps.onBlur === 'function') {
        (childProps.onBlur as (e: React.FocusEvent) => void)(e);
      }
    },
  });

  const portal =
    visible && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            onMouseEnter={() => { tooltipHovered.current = true; clearHide(); }}
            onMouseLeave={() => { tooltipHovered.current = false; deferHide(); }}
            className={[s.tooltip, geometry, className].filter(Boolean).join(' ')}
          >
            {content}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {trigger}
      {portal}
    </>
  );
};
