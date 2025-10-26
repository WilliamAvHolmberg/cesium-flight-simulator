import { useVehicleState } from '../hooks/useVehicleState';

export function Speedometer() {
  const { speed } = useVehicleState();
  const speedValue = Math.round(speed);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative px-4 py-3 glass-panel">
        <div className="absolute inset-0 bg-gradient-to-br from-future-primary/5 to-future-secondary/5 rounded-xl" />
        <div className="relative flex flex-col items-center">
          <div className="text-3xl font-light tabular-nums text-white tracking-tight">
            {speedValue}
          </div>
          <div className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5 font-medium">
            km/h
          </div>
        </div>
      </div>
    </div>
  );
}


