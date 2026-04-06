'use client';

import type React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  const reducedMotion = useReducedMotion();
  const motionProps = props as HTMLMotionProps<'button'>;

  return (
    <motion.button
      whileHover={reducedMotion || props.disabled ? undefined : { y: -1, scale: 1.01 }}
      whileTap={reducedMotion || props.disabled ? undefined : { y: 0, scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30, mass: 0.45 }}
      className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} ${className}`}
      {...motionProps}
    />
  );
}
