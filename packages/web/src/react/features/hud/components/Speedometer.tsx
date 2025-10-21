import { useVehicleState } from '../hooks/useVehicleState';

export function Speedometer() {
  const { speed } = useVehicleState();
  const speedValue = Math.round(speed);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative px-8 py-6 glass-panel">
        <div className="absolute inset-0 bg-gradient-to-br from-future-primary/5 to-future-secondary/5 rounded-xl" />
        <div className="relative flex flex-col items-center">
          <div className="text-6xl font-light tabular-nums text-white tracking-tight">
            {speedValue}
          </div>
          <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1 font-medium">
            km/h
          </div>
        </div>
      </div>
    </div>
  );
}


