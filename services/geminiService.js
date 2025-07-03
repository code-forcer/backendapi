const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Updated model name from "gemini-pro" to "gemini-1.5-flash"
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateStockInsights(stockData) {
    try {
      const prompt = `
        Analyze this stock data and provide a brief insight (max 100 words):
        
        Stock: ${stockData.symbol} (${stockData.name})
        Current Price: $${stockData.close}
        Change: ${stockData.percentChange}%
        Volume: ${stockData.volume}
        P/E Ratio: ${stockData.peRatio}
        Market Cap: ${stockData.marketCap}
        
        Provide a concise analysis focusing on:
        1. Current performance
        2. Key metrics interpretation
        3. Brief outlook (neutral tone)
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      return 'AI insights temporarily unavailable';
    }
  }

  async batchAnalyzeStocks(stocksData) {
    const insights = {};
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < stocksData.length; i += 3) {
      const batch = stocksData.slice(i, i + 3);
      
      const batchPromises = batch.map(async (stock) => {
        try {
          const insight = await this.generateStockInsights(stock);
          return { symbol: stock.symbol, insight };
        } catch (error) {
          console.error(`Error analyzing ${stock.symbol}:`, error);
          return { symbol: stock.symbol, insight: 'Analysis unavailable' };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        insights[result.symbol] = result.insight;
      });

      // Add delay between batches to respect rate limits
      if (i + 3 < stocksData.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return insights;
  }
}

module.exports = new GeminiService();