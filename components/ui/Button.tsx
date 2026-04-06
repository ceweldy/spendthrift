import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return <button className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} ${className}`} {...props} />;
}
