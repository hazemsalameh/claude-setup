import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'motion/react';
import './ShinyText.css';

const ShinyText = ({
  text,
  disabled = false,
  speed = 2,
  className = '',
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
}) => {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef(null);
  const animationDuration = speed * 1000;

  useAnimationFrame(time => {
    if (disabled) { lastTimeRef.current = null; return; }
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += delta;
    const cycleTime = elapsedRef.current % (animationDuration * 1.5);
    if (cycleTime < animationDuration) {
      progress.set((cycleTime / animationDuration) * 100);
    } else {
      progress.set(100);
    }
  });

  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);

  const gradientStyle = {
    backgroundImage: `linear-gradient(120deg, ${color} calc(var(--p) - ${spread / 2}px), ${shineColor} var(--p), ${color} calc(var(--p) + ${spread / 2}px))`,
    backgroundSize: '250% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    display: 'inline-block',
  };

  return (
    <motion.span
      className={`shiny-text ${className}`}
      style={{
        ...gradientStyle,
        '--p': backgroundPosition,
        backgroundPosition,
      }}
    >
      {text}
    </motion.span>
  );
};

export default ShinyText;
