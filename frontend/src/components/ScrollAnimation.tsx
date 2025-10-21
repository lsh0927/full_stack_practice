'use client';

import { motion, useInView } from 'framer-motion';
import { ReactNode, useRef } from 'react';

type AnimationType = 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn';

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const animations = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
};

export default function ScrollAnimation({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration = 0.6,
  className = '',
  once = true,
}: ScrollAnimationProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once,
    margin: '-50px',
    amount: 0.3,
  });

  const selectedAnimation = animations[animation];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={selectedAnimation}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1] as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
