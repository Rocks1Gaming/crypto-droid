
export type Currency = 'USD' | 'EUR';
export type DataSource = 'BINANCE' | 'KRAKEN';

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number; // In the requested Currency (USD or EUR)
  change24h: number; // Percentage
  history: { time: string; price: number }[];
  color: string;
}

export interface MarketAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  summary: string;
  keyLevels: string;
}

export enum AppTab {
  MARKET = 'market',
  ANALYSIS = 'analysis',
  SETTINGS = 'settings'
}
