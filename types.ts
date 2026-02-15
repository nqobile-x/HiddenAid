export interface DigitalCard {
  id: string;
  name: string;
  condition: string;
  needs: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  themeColor: string;
  iconUrl?: string;
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  groundingSources?: { uri: string; title: string }[];
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  WIDE = '16:9',
  TALL = '9:16',
  CINEMA = '21:9',
  PHOTO_P = '2:3',
  PHOTO_L = '3:2'
}

export type AppMode = 'cards' | 'chat' | 'live' | 'tools';
