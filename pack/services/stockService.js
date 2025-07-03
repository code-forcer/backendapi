const yahooFinance = require('yahoo-finance2').default;

class StockService {
  constructor() {
    this.defaultSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'];
  }

  async fetchStockData(symbols = this.defaultSymbols) {
    const stockData = [];

    for (const symbol of symbols) {
      try {
        console.log(`Fetching data for ${symbol}...`);
        
        // Get quote data
        const quote = await yahooFinance.quote(symbol);
        
        // Get additional data
        const summaryDetail = await yahooFinance.quoteSummary(symbol, {
          modules: ['summaryDetail', 'defaultKeyStatistics']
        });

        const stock = {
          symbol: quote.symbol,
          name: quote.longName || quote.shortName || symbol,
          open: quote.regularMarketOpen || 0,
          high: quote.regularMarketDayHigh || 0,
          low: quote.regularMarketDayLow || 0,
          close: quote.regularMarketPrice || 0,
          volume: quote.regularMarketVolume || 0,
          marketCap: quote.marketCap || 0,
          peRatio: quote.trailingPE || summaryDetail?.defaultKeyStatistics?.trailingPE || 0,
          dividendYield: (quote.dividendYield * 100) || 0,
          percentChange: quote.regularMarketChangePercent * 100 || 0,
          sector: quote.sector || '',
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
          averageVolume: quote.averageVolume || 0,
          beta: summaryDetail?.defaultKeyStatistics?.beta || 0
        };

        stockData.push(stock);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error.message);
        // Add placeholder data for failed requests
        stockData.push({
          symbol,
          name: symbol,
          open: 0, high: 0, low: 0, close: 0, volume: 0,
          marketCap: 0, peRatio: 0, dividendYield: 0, percentChange: 0,
          sector: '', fiftyTwoWeekHigh: 0, fiftyTwoWeekLow: 0,
          averageVolume: 0, beta: 0
        });
      }
    }

    return stockData;
  }
}

module.exports = new StockService();