import { useRef } from 'react';

export interface DoubleTapConfig {
  delay?: number; // milliseconds between taps
}

export function useDoubleTap(onDoubleTap: () => void, config: DoubleTapConfig = {}) {
  const { delay = 300 } = config;
  const lastTap = useRef<number>(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;

    if (timeSinceLastTap < delay) {
      // Double tap detected
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
      onDoubleTap();
      lastTap.current = 0;
    } else {
      // First tap of potential double tap
      lastTap.current = now;
    }
  };

  return { onTap: handleTap };
}

export interface LongPressConfig {
  delayMs?: number;
  maxDistance?: number;
}

export interface LongPressState {
  isPressed: boolean;
  isLongPressed: boolean;
}

export function useLongPress(
  onLongPress: () => void,
  config: LongPressConfig = {}
) {
  const { delayMs = 500, maxDistance = 10 } = config;
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);

  const handlePressIn = (event: any) => {
    startX.current = event.nativeEvent.pageX;
    startY.current = event.nativeEvent.pageY;

    pressTimer.current = setTimeout(() => {
      onLongPress();
    }, delayMs);
  };

  const handlePressMove = (event: any) => {
    const distance = Math.sqrt(
      Math.pow(event.nativeEvent.pageX - startX.current, 2) +
        Math.pow(event.nativeEvent.pageY - startY.current, 2)
    );

    if (distance > maxDistance && pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handlePressOut = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  return {
    onPressIn: handlePressIn,
    onPressMove: handlePressMove,
    onPressOut: handlePressOut,
  };
}
