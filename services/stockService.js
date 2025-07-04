const yahooFinance = require('yahoo-finance2').default;

class PreferredStockService {
  constructor() {
    // Default preferred stock symbols - these are real preferred stocks
    this.defaultSymbols = [
      'BAC-PL',    // Bank of America Preferred Series L
      'JPM-PC',    // JPMorgan Chase Preferred Series C
      'WFC-PL',    // Wells Fargo Preferred Series L
      'C-PN',      // Citigroup Preferred Series N
      'GS-PA',     // Goldman Sachs Preferred Series A
      'MS-PA',     // Morgan Stanley Preferred Series A
      'USB-PA',    // U.S. Bancorp Preferred Series A
      'PNC-PP',    // PNC Financial Preferred Series P
      'TFC-PO',    // Truist Financial Preferred Series O
      'KEY-PJ'     // KeyCorp Preferred Series J
    ];
  }

  async fetchPreferredStockData(symbols = this.defaultSymbols) {
    const preferredStockData = [];

    for (const symbol of symbols) {
      try {
        console.log(`Fetching preferred stock data for ${symbol}...`);
        
        // Get quote data
        const quote = await yahooFinance.quote(symbol);
        
        // Get additional data - preferred stocks may have limited data availability
        let summaryDetail = null;
        try {
          summaryDetail = await yahooFinance.quoteSummary(symbol, {
            modules: ['summaryDetail', 'defaultKeyStatistics']
          });
        } catch (detailError) {
          console.warn(`Limited data available for preferred stock ${symbol}`);
        }

        const preferredStock = {
          symbol: quote.symbol,
          name: quote.longName || quote.shortName || symbol,
          open: quote.regularMarketOpen || 0,
          high: quote.regularMarketDayHigh || 0,
          low: quote.regularMarketDayLow || 0,
          close: quote.regularMarketPrice || 0,
          volume: quote.regularMarketVolume || 0,
          marketCap: quote.marketCap || 0,
          // Preferred stocks typically don't have P/E ratios in the traditional sense
          peRatio: quote.trailingPE || 0,
          // Dividend yield is very important for preferred stocks
          dividendYield: (quote.dividendYield * 100) || 0,
          // Annual dividend rate (important for preferred stocks)
          dividendRate: quote.dividendRate || 0,
          percentChange: quote.regularMarketChangePercent * 100 || 0,
          sector: quote.sector || 'Financial', // Most preferred stocks are from financial sector
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
          averageVolume: quote.averageVolume || 0,
          beta: summaryDetail?.defaultKeyStatistics?.beta || 0,
          // Additional preferred stock specific fields
          currency: quote.currency || 'USD',
          exchange: quote.fullExchangeName || quote.exchange || '',
          // Preferred stocks often have par values
          parValue: summaryDetail?.summaryDetail?.parValue || 25, // Default $25 par value
          // Preferred dividend information
          exDividendDate: quote.exDividendDate || null,
          dividendDate: quote.dividendDate || null,
          // Preferred stock type indicator
          stockType: 'Preferred'
        };

        preferredStockData.push(preferredStock);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching preferred stock data for ${symbol}:`, error.message);
        // Add placeholder data for failed requests
        preferredStockData.push({
          symbol,
          name: symbol,
          open: 0, high: 0, low: 0, close: 0, volume: 0,
          marketCap: 0, peRatio: 0, dividendYield: 0, dividendRate: 0,
          percentChange: 0, sector: 'Financial', fiftyTwoWeekHigh: 0, 
          fiftyTwoWeekLow: 0, averageVolume: 0, beta: 0,
          currency: 'USD', exchange: '', parValue: 25,
          exDividendDate: null, dividendDate: null, stockType: 'Preferred'
        });
      }
    }

    return preferredStockData;
  }

  // Method to add custom preferred stock symbols
  addPreferredStock(symbol) {
    if (!this.defaultSymbols.includes(symbol)) {
      this.defaultSymbols.push(symbol);
    }
  }

  // Method to get preferred stocks by sector or company
  async fetchPreferredStocksByCompany(companySymbol) {
    try {
      // This would attempt to find preferred stocks for a given company
      // Note: This is a simplified approach - in reality, you'd need a more sophisticated method
      const preferredVariants = [
        `${companySymbol}-PA`, `${companySymbol}-PB`, `${companySymbol}-PC`,
        `${companySymbol}-PD`, `${companySymbol}-PE`, `${companySymbol}-PF`,
        `${companySymbol}-PG`, `${companySymbol}-PH`, `${companySymbol}-PI`,
        `${companySymbol}-PJ`, `${companySymbol}-PK`, `${companySymbol}-PL`
      ];

      const validPreferredStocks = [];
      
      for (const variant of preferredVariants) {
        try {
          const quote = await yahooFinance.quote(variant);
          if (quote && quote.regularMarketPrice) {
            validPreferredStocks.push(variant);
          }
        } catch (error) {
          // Symbol doesn't exist, continue
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (validPreferredStocks.length > 0) {
        return await this.fetchPreferredStockData(validPreferredStocks);
      } else {
        console.log(`No preferred stocks found for ${companySymbol}`);
        return [];
      }
    } catch (error) {
      console.error(`Error searching for preferred stocks of ${companySymbol}:`, error.message);
      return [];
    }
  }
}

module.exports = new PreferredStockService();