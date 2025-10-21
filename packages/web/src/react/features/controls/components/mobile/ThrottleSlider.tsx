import { useState, useRef, useEffect } from 'react';
import { HapticFeedback } from '../../../../shared/utils/haptics';

interface ThrottleSliderProps {
  onChange: (throttlePercent: number) => void;
}

export function ThrottleSlider({ onChange }: ThrottleSliderProps) {
  const [throttle, setThrottle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const lastHapticThrottle = useRef(0);

  const updateThrottle = (clientY: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const percent = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
    
    const throttleDiff = Math.abs(percent - lastHapticThrottle.current);
    if (throttleDiff >= 10) {
      HapticFeedback.light();
      lastHapticThrottle.current = percent;
    }
    
    setThrottle(percent);
    onChange(percent);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    HapticFeedback.medium();
    updateThrottle(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    updateThrottle(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('touchend', handleGlobalTouchEnd);
      return () => window.removeEventListener('touchend', handleGlobalTouchEnd);
    }
  }, [isDragging]);

  return (
    <div
      ref={sliderRef}
      className="fixed right-0 top-0 h-full w-24 flex items-center justify-center z-40"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <div className="relative h-[50vh] w-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400 to-yellow-400 rounded-full transition-all duration-75"
          style={{ height: `${throttle}%` }}
        />
      </div>
      
      <div className="absolute top-1/2 -translate-y-1/2 right-2 text-white/40 text-xs font-mono">
        {Math.round(throttle)}
      </div>
    </div>
  );
}
