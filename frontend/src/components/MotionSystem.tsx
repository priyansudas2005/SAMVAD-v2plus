import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// --- Spring Physics Tokens (120-250ms feel) ---
export const SPRING_TRANSITION = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
  mass: 0.8
};

export const FAST_SPRING = {
  type: 'spring',
  stiffness: 450,
  damping: 30,
  mass: 0.5
};

export const SMOOTH_SPRING = {
  type: 'spring',
  stiffness: 300,
  damping: 24,
  mass: 0.9
};

// 1. --- Page Transition Wrapper ---
export const MotionPage: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.995 }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full h-full flex flex-col flex-1 min-w-0 min-h-0 ${className}`}
    >
      {children}
    </motion.div>
  );
};

// 2. --- Card Hover Elevation ---
export const MotionCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  hoverElevation?: boolean;
}> = ({ children, className = '', onClick, hoverElevation = true }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion || !hoverElevation ? {} : { y: -3, scale: 1.008 }}
      whileTap={onClick ? { scale: 0.985 } : {}}
      transition={FAST_SPRING}
      onClick={onClick}
      className={`transition-colors duration-150 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

// 3. --- Button Press Feedback ---
export const MotionButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}> = ({ children, onClick, className = '', disabled = false, type = 'button', title }) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      transition={FAST_SPRING}
      className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1016] ${className}`}
    >
      {children}
    </motion.button>
  );
};

// 4. --- Accordion Collapse/Expand Animation ---
export const MotionAccordion: React.FC<{
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`overflow-hidden ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 5. --- Dialog Modal Entrance & Exit ---
export const MotionDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, onClose, children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-[#10131c] border border-slate-800 shadow-2xl rounded-2xl overflow-hidden ${className}`}
        >
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// 6. --- Smooth Numerical Counter Animation ---
export const MotionCounter: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({ value, prefix = '', suffix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 250; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.round(start + (end - start) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value]);

  return (
    <span className={`font-mono font-bold tracking-tight ${className}`}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

// 7. --- Search Highlight Text Pulse ---
export const MotionHighlightText: React.FC<{
  text: string;
  query: string;
  className?: string;
}> = ({ text, query, className = '' }) => {
  if (!query.trim()) return <span className={className}>{text}</span>;

  const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <motion.mark
            key={i}
            initial={{ backgroundColor: 'rgba(139, 92, 246, 0.4)' }}
            animate={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
            transition={{ duration: 0.3 }}
            className="text-violet-300 font-semibold px-0.5 rounded border border-violet-500/30"
          >
            {part}
          </motion.mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

// 8. --- AI Assistant Typing Indicator ---
export const MotionAITypingDots: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#141722] border border-slate-800 rounded-xl w-fit">
      {[0, 1, 2].map((idx) => (
        <motion.span
          key={idx}
          animate={shouldReduceMotion ? { opacity: [0.3, 1, 0.3] } : { y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: idx * 0.15,
            ease: 'easeInOut'
          }}
          className="w-1.5 h-1.5 bg-violet-400 rounded-full"
        />
      ))}
    </div>
  );
};

// 9. --- Timeline Item Reveal Animation ---
export const MotionTimelineList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const MotionTimelineItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.div variants={itemVariants} transition={SPRING_TRANSITION} className={className}>
      {children}
    </motion.div>
  );
};
