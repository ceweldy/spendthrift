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
      whileHover={reducedMotion || props.disabled ? undefined : { y: -4, scale: 1.06, rotate: -1.2 }}
      whileTap={reducedMotion || props.disabled ? undefined : { y: 1, scale: 0.92, rotate: 0.8 }}
      transition={{ type: 'spring', stiffness: 700, damping: 20, mass: 0.4 }}
      className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} ${className}`}
      {...motionProps}
    />
  );
}
