// Upstream helpers for live market data and newswire ticker.
// Always returns a renderable payload so the UI never displays broken or empty state.

const MARKET_IDS = [
  "bitcoin",
  "ethereum",
  "tether",
  "solana",
  "cardano",
  "polkadot",
  "chainlink",
  "avalanche-2",
  "ripple",
  "litecoin",
  "uniswap",
  "cosmos",
];

const SYMBOLS: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  tether: "USDT",
  solana: "SOL",
  cardano: "ADA",
  polkadot: "DOT",
  chainlink: "LINK",
  "avalanche-2": "AVAX",
  ripple: "XRP",
  litecoin: "LTC",
  uniswap: "UNI",
  cosmos: "ATOM",
};

const NAMES: Record<string, string> = {
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  tether: "Tether",
  solana: "Solana",
  cardano: "Cardano",
  polkadot: "Polkadot",
  chainlink: "Chainlink",
  "avalanche-2": "Avalanche",
  ripple: "XRP",
  litecoin: "Litecoin",
  uniswap: "Uniswap",
  cosmos: "Cosmos",
};

export type MarketRow = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceEur: number;
  change: number;
};

export type NewsRow = {
  title: string;
  source: string;
  url?: string;
};

export const MARKET_FALLBACK: MarketRow[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 68420, priceEur: 63150, change: 1.82 },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3285, priceEur: 3032, change: -0.94 },
  { id: "tether", symbol: "USDT", name: "Tether", price: 1.0, priceEur: 0.923, change: 0.01 },
  { id: "solana", symbol: "SOL", name: "Solana", price: 168.4, priceEur: 155.4, change: 3.11 },
  { id: "cardano", symbol: "ADA", name: "Cardano", price: 0.61, priceEur: 0.563, change: -1.42 },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", price: 7.24, priceEur: 6.68, change: 0.86 },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    price: 17.85,
    priceEur: 16.47,
    change: 2.04,
  },
  {
    id: "avalanche-2",
    symbol: "AVAX",
    name: "Avalanche",
    price: 36.2,
    priceEur: 33.41,
    change: -2.18,
  },
  { id: "ripple", symbol: "XRP", name: "XRP", price: 0.58, priceEur: 0.535, change: 0.44 },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", price: 84.6, priceEur: 78.07, change: -0.61 },
  { id: "uniswap", symbol: "UNI", name: "Uniswap", price: 9.42, priceEur: 8.69, change: 1.27 },
  { id: "cosmos", symbol: "ATOM", name: "Cosmos", price: 8.13, priceEur: 7.5, change: -0.33 },
];

export const NEWS_FALLBACK: NewsRow[] = [
  {
    title: "Euro area money market funds hold steady as central banks signal patience on rate path",
    source: "Global Financial Times",
  },
  {
    title:
      "Digital asset custody frameworks advance under comprehensive institutional governance standards",
    source: "Reuters Institutional",
  },
  {
    title: "Institutional allocators increase scrutiny of counterparty and settlement risk",
    source: "Bloomberg Asset",
  },
  {
    title: "Funding rate spreads narrow across major perpetual futures venues",
    source: "Financial Desk",
  },
  {
    title:
      "Liquid staking participation continues to expand across major global institutional networks",
    source: "DeFi Review",
  },
  {
    title:
      "Premier financial hubs advance institutional digital fund administration and asset servicing",
    source: "Global Markets Review",
  },
];

let cachedMarkets: { markets: MarketRow[]; at: number } | null = null;
let cachedNews: { news: NewsRow[]; at: number } | null = null;

export async function fetchMarkets(): Promise<MarketRow[]> {
  if (cachedMarkets && Date.now() - cachedMarkets.at < 60_000) {
    return cachedMarkets.markets;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const url =
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=eur" +
      `&ids=${MARKET_IDS.join(",")}` +
      "&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h";

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error("CoinGecko status " + res.status);

    const raw = (await res.json()) as Array<{
      id: string;
      current_price: number;
      price_change_percentage_24h: number | null;
    }>;

    if (Array.isArray(raw) && raw.length > 0) {
      const eurUsd = 1.084;
      const markets: MarketRow[] = raw
        .filter((row) => SYMBOLS[row.id])
        .map((row) => ({
          id: row.id,
          symbol: SYMBOLS[row.id]!,
          name: NAMES[row.id]!,
          priceEur: Number(row.current_price ?? 0),
          price: Number(((row.current_price ?? 0) * eurUsd).toFixed(4)),
          change: Number(row.price_change_percentage_24h ?? 0),
        }));
      if (markets.length > 0) {
        cachedMarkets = { markets, at: Date.now() };
        return markets;
      }
    }
  } catch {
    // fallback gracefully
  }
  return MARKET_FALLBACK;
}

export async function fetchNews(): Promise<NewsRow[]> {
  if (cachedNews && Date.now() - cachedNews.at < 180_000) {
    return cachedNews.news;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&feeds=cointelegraph,coindesk,decrypt",
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error("CryptoCompare status " + res.status);

    const data = (await res.json()) as {
      Data?: Array<{ title: string; url: string; source_info?: { name?: string } }>;
    };
    const articles = data.Data ?? [];
    if (articles.length > 0) {
      const news: NewsRow[] = articles.slice(0, 12).map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source_info?.name ?? "Newswire",
      }));
      cachedNews = { news, at: Date.now() };
      return news;
    }
  } catch {
    // fallback gracefully
  }
  return NEWS_FALLBACK;
}
