import React from 'react';
import s from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  iconOnly?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  iconOnly = false,
  className = '',
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

  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
};
