import { Panel } from '../../../shared/components/Panel';
import { Speedometer } from './Speedometer';

export function HUD() {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      <Panel variant="minimal">
        <Speedometer />
      </Panel>
    </div>
  );
}


