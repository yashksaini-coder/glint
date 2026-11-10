// Bridge exposed by src/preload/index.ts.
interface Window {
  glint: {
    apiKey(): Promise<string>;
    record(on: boolean): Promise<string | null>;
    frame(line: string): void;
    copy(text: string): Promise<void>;
    replay(): Promise<string>;
    speak(text: string): Promise<boolean>;
  };
}
