import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LetterPullUpProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

/**
 * React Bits-style letter-by-letter pull-up text reveal animation.
 */
const LetterPullUp: React.FC<LetterPullUpProps> = ({
  text,
  className,
  delay = 0,
  staggerDelay = 0.03,
}) => {
  const words = text.split(' ');

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.35,
      },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={cn('inline-flex flex-wrap', className)}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-flex mr-[0.25em]">
          {word.split('').map((letter, letterIndex) => (
            <motion.span
              key={`${wordIndex}-${letterIndex}`}
              variants={letterVariants}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
};
LetterPullUp.displayName = 'LetterPullUp';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

/**
 * React Bits-style text reveal with a gradient mask sweep.
 */
const TextReveal: React.FC<TextRevealProps> = ({
  text,
  className,
  delay = 0,
  duration = 0.6,
}) => {
  return (
    <motion.span
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn('inline-block', className)}
    >
      {text}
    </motion.span>
  );
};
TextReveal.displayName = 'TextReveal';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
  animate?: boolean;
}

/**
  * Highlight text styling without artificial gradient mask tells.
  */
const GradientText: React.FC<GradientTextProps> = ({
  children,
  className,
}) => {
  return (
    <span className={cn('text-sky-400 font-bold', className)}>
      {children}
    </span>
  );
};
GradientText.displayName = 'GradientText';

export { LetterPullUp, TextReveal, GradientText };
