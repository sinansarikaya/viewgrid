import React from 'react';
import s from './Button.module.css';
import { Tooltip } from './Tooltip';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  iconOnly?: boolean;
  tooltip?: string;
  tooltipPlacement?: 'top' | 'bottom';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  iconOnly = false,
  className = '',
  title,
  tooltip,
  tooltipPlacement = 'top',
  ...props
}) => {
  const classNames = [
    s.button,
    variant === 'primary' ? s.primary : '',
    variant === 'danger' ? s.danger : '',
    iconOnly ? s.iconOnly : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tooltipText = tooltip || title || (iconOnly && props['aria-label'] ? props['aria-label'] : undefined);

  const btnElement = (
    <button className={classNames} title={title} {...props}>
      {children}
    </button>
  );

  if (tooltipText) {
    return (
      <Tooltip content={tooltipText} placement={tooltipPlacement}>
        {btnElement}
      </Tooltip>
    );
  }

  return btnElement;
};
