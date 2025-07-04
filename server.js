require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const Stock = require('./models/Stock');
const preferredStockService = require('./services/stockService'); // Your preferred stock service
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
    console.log('🔄 Starting preferred stock data update...');
    
    // Changed method name to match your preferred stock service
    const stockData = await preferredStockService.fetchPreferredStockData();
    console.log(`📊 Fetched data for ${stockData.length} preferred stocks`);

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

    console.log('✅ Preferred stock data updated successfully');
  } catch (error) {
    console.error('❌ Error updating preferred stock data:', error);
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
      lastUpdated: stocks[0]?.lastUpdated || null,
      count: stocks.length,
      type: 'preferred-stocks'
    });
  } catch (error) {
    console.error('Error fetching stocks from database:', error);
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
        error: 'Preferred stock not found'
      });
    }
    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// New route to fetch preferred stocks by company
app.get('/api/stocks/company/:symbol', async (req, res) => {
  try {
    const companySymbol = req.params.symbol.toUpperCase();
    const preferredStocks = await preferredStockService.fetchPreferredStocksByCompany(companySymbol);
    
    res.json({
      success: true,
      data: preferredStocks,
      company: companySymbol,
      count: preferredStocks.length
    });
  } catch (error) {
    console.error('Error fetching preferred stocks by company:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test route to verify preferred stock service is working
app.get('/api/test-preferred', async (req, res) => {
  try {
    console.log('Testing preferred stock service...');
    const testData = await preferredStockService.fetchPreferredStockData(['BAC-PL']);
    
    res.json({
      success: true,
      message: 'Preferred stock service is working',
      testData: testData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing preferred stock service:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Preferred stock service test failed'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    service: 'Preferred Stock API'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('🚀 Preferred stock data cron job started');
  console.log('📊 Available endpoints:');
  console.log('  - GET /api/stocks (all preferred stocks)');
  console.log('  - GET /api/stocks/:symbol (specific preferred stock)');
  console.log('  - GET /api/stocks/company/:symbol (preferred stocks by company)');
  console.log('  - GET /api/test-preferred (test the service)');
  console.log('  - GET /api/health (health check)');
});