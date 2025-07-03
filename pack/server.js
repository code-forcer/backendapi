require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const Stock = require('./models/Stock');
const stockService = require('./services/stockService');
const geminiService = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Cron job function
async function updateStockData() {
  try {
    console.log('🔄 Starting stock data update...');
    
    const stockData = await stockService.fetchStockData();
    console.log(`📊 Fetched data for ${stockData.length} stocks`);

    const insights = await geminiService.batchAnalyzeStocks(stockData);

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

// Schedule cron jobs
cron.schedule('*/15 9-16 * * 1-5', updateStockData, {
  timezone: "America/New_York"
});
cron.schedule('0 * * * *', updateStockData);

// Run immediately when started
updateStockData();

// Routes
app.get('/api/stocks', async (req, res) => {
  try {
    const stocks = await Stock.find({}).sort({ lastUpdated: -1 });
    res.json({
      success: true,
      data: stocks,
      lastUpdated: stocks[0]?.lastUpdated || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/stocks/:symbol', async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }
    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('🚀 Stock data cron job started');
});