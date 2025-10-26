import { createRoot } from 'react-dom/client';
import { TokenSetup } from './components/TokenSetup';
import './index.css';

export function mountTokenSetup(onComplete: () => void) {
  const rootElement = document.getElementById('react-root');
  if (!rootElement) {
    throw new Error('React root element not found');
  }

  const root = createRoot(rootElement);
  root.render(<TokenSetup onComplete={onComplete} />);

  return root;
}


