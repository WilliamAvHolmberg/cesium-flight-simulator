import { InputManager, InputAction } from './InputManager';

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type VoiceCommand = {
  keywords: string[];
  action: InputAction;
  continuous?: boolean; // If true, action stays active until stopped
};

export class VoiceControlManager {
  private recognition: SpeechRecognition | null = null;
  private inputManager: InputManager;
  private isActive: boolean = false;
  private activeCommands: Set<InputAction> = new Set();

  // Command mappings - both Swedish and English
  private commands: VoiceCommand[] = [
    // Throttle/Brake
    { keywords: ['framåt', 'gas', 'forward', 'accelerate', 'throttle'], action: 'throttle', continuous: true },
    { keywords: ['bromsa', 'stanna', 'brake', 'stop', 'slow'], action: 'brake', continuous: true },

    // Turning
    { keywords: ['vänster', 'sväng vänster', 'left', 'turn left'], action: 'turnLeft', continuous: true },
    { keywords: ['höger', 'sväng höger', 'right', 'turn right'], action: 'turnRight', continuous: true },

    // Roll (aircraft)
    { keywords: ['rulla vänster', 'roll vänster', 'roll left'], action: 'rollLeft', continuous: true },
    { keywords: ['rulla höger', 'roll höger', 'roll right'], action: 'rollRight', continuous: true },

    // Altitude
    { keywords: ['upp', 'stiga', 'up', 'climb', 'altitude up'], action: 'altitudeUp', continuous: true },
    { keywords: ['ner', 'sjunk', 'down', 'descend', 'altitude down'], action: 'altitudeDown', continuous: true },

    // Toggle commands
    { keywords: ['byt kamera', 'kamera', 'switch camera', 'camera'], action: 'switchCamera' },
    { keywords: ['byt fordon', 'bil', 'flygplan', 'switch vehicle', 'toggle vehicle'], action: 'toggleRoverMode' },
    { keywords: ['starta om', 'restart'], action: 'restart' },

    // Stop all continuous actions
    { keywords: ['stopp', 'sluta', 'stop all', 'halt', 'release'], action: 'brake', continuous: false }
  ];

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'sv-SE'; // Swedish, but will also recognize English
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results[event.resultIndex];
      const transcript = results[0].transcript.toLowerCase().trim();

      console.log('Voice command detected:', transcript);
      this.processCommand(transcript);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Automatically restart if no speech detected
        this.restart();
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if still active
      if (this.isActive) {
        this.restart();
      }
    };
  }

  private processCommand(transcript: string): void {
    // Check for "stop all" command first
    if (transcript.includes('stopp') || transcript.includes('sluta') ||
        transcript.includes('stop all') || transcript.includes('halt') ||
        transcript.includes('release')) {
      this.releaseAllContinuousActions();
      return;
    }

    // Find matching command
    for (const command of this.commands) {
      for (const keyword of command.keywords) {
        if (transcript.includes(keyword)) {
          this.executeCommand(command);
          return;
        }
      }
    }
  }

  private executeCommand(command: VoiceCommand): void {
    if (command.continuous) {
      // For continuous actions, activate and keep active
      this.inputManager['setInputState'](command.action, true);
      this.activeCommands.add(command.action);

      // Auto-release after 3 seconds to prevent stuck controls
      setTimeout(() => {
        if (this.activeCommands.has(command.action)) {
          this.inputManager['setInputState'](command.action, false);
          this.activeCommands.delete(command.action);
        }
      }, 3000);
    } else {
      // For one-time actions, trigger immediately
      this.inputManager['setInputState'](command.action, true);
      setTimeout(() => {
        this.inputManager['setInputState'](command.action, false);
      }, 50);
    }
  }

  private releaseAllContinuousActions(): void {
    this.activeCommands.forEach(action => {
      this.inputManager['setInputState'](action, false);
    });
    this.activeCommands.clear();
  }

  public start(): void {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return;
    }

    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.recognition.start();
    console.log('Voice control started');
  }

  public stop(): void {
    if (!this.recognition || !this.isActive) {
      return;
    }

    this.isActive = false;
    this.recognition.stop();
    this.releaseAllContinuousActions();
    console.log('Voice control stopped');
  }

  private restart(): void {
    if (this.recognition && this.isActive) {
      try {
        this.recognition.start();
      } catch (e) {
        // Already running, ignore
      }
    }
  }

  public toggle(): boolean {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
    return this.isActive;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public destroy(): void {
    this.stop();
    this.recognition = null;
  }
}
