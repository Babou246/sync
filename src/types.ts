export interface DataRow {
  [key: string]: string | number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface LabeledData extends DataRow {
  labels: Label[];
}

export interface ColumnConfig {
  name: string;
  selected: boolean;
  type: 'numeric' | 'categorical';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ApiConfig {
  apiKey: string;
  isConfigured: boolean;
}