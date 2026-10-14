import React from 'react';
import { Icon } from './Icon';
import s from './Checkbox.module.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> { children?: React.ReactNode }
export function Checkbox({ children, className='', disabled, ...props }: CheckboxProps) {
  const control=<span className={s.control}><input {...props} type="checkbox" disabled={disabled} className={s.input} /><Icon name="check" className={s.check} /></span>;
  const classes=[s.checkbox,disabled?s.disabled:'',className].filter(Boolean).join(' ');
  return children ? <label className={classes}>{control}<span>{children}</span></label> : <span className={classes}>{control}</span>;
}
