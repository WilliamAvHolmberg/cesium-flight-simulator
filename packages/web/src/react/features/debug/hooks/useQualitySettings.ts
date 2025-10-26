import { useState, useEffect } from 'react';
import { useGameMethod } from '../../../hooks/useGameMethod';
import type { QualityConfig } from '../../../../cesium/core/Scene';

export function useQualitySettings() {
  const { getQualitySettings, updateQualitySettings, applyQualityPreset } = useGameMethod();
  const [config, setConfig] = useState<QualityConfig>(getQualitySettings());

  useEffect(() => {
    const interval = setInterval(() => {
      setConfig(getQualitySettings());
    }, 500);
    return () => clearInterval(interval);
  }, [getQualitySettings]);

  const updateSetting = <K extends keyof QualityConfig>(key: K, value: QualityConfig[K]) => {
    const newConfig = { [key]: value };
    updateQualitySettings(newConfig);
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const applyPreset = (preset: 'performance' | 'balanced' | 'quality' | 'ultra') => {
    applyQualityPreset(preset);
    setTimeout(() => setConfig(getQualitySettings()), 100);
  };

  return {
    config,
    updateSetting,
    applyPreset,
  };
}


