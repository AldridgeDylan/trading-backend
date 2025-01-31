import yahooFinance from 'yahoo-finance2';

export default async function getStockPrice(symbol: string): Promise<number | null> {
    const stockData = await yahooFinance.quote(symbol);
    if (!stockData.regularMarketPrice) {
        return null;
    } else {
        return stockData.regularMarketPrice;
    }
}