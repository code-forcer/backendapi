require('dotenv').config();
const mongoose = require('mongoose');
const cron = require('node-cron');
const Stock = require('./models/Stock');
const stockService = require('./services/stockService');
const geminiService = require('./services/geminiService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateStockData() {
  try {
    console.log('🔄 Starting stock data update...');
    
    // Fetch fresh stock data
    const stockData = await stockService.fetchStockData();
    console.log(`📊 Fetched data for ${stockData.length} stocks`);

    // Get AI insights for stocks (in batches to save on API calls)
    console.log('🤖 Generating AI insights...');
    const insights = await geminiService.batchAnalyzeStocks(stockData);

    // Update database
    for (const stock of stockData) {
      await Stock.findOneAndUpdate(
        { symbol: stock.symbol },
        { 
          ...stock,
          aiInsights: insights[stock.symbol] || '',
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Stock data updated successfully');
  } catch (error) {
    console.error('❌ Error updating stock data:', error);
  }
}

// Run every 15 minutes during market hours (9 AM - 4 PM EST, Mon-Fri)
cron.schedule('*/15 9-16 * * 1-5', updateStockData, {
  timezone: "America/New_York"
});

// Run once every hour outside market hours
cron.schedule('0 * * * *', updateStockData);

// Run immediately when started
updateStockData();

console.log('🚀 Stock data cron job started');