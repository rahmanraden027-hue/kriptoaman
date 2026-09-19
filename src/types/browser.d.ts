interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request(args: { method: string; params?: unknown[] | object }): Promise<any>;
    on?(event: string, listener: (...args: any[]) => void): void;
    removeListener?(event: string, listener: (...args: any[]) => void): void;
  };
  mixpanel?: { track(event: string, properties?: Record<string, unknown>): void };
}

interface Navigator {
  standalone?: boolean;
}
