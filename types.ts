
export interface TokenUsage {
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isLoading?: boolean;
  usage?: TokenUsage;
  citations?: string[]; // Array of citation strings (e.g., "Policy.pdf > Section 3.1")
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  base64: string; // Base64 encoded string without the data URL prefix
  mimeType: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export enum AppView {
  LOGIN = 'LOGIN',
  CHAT = 'CHAT',
}
