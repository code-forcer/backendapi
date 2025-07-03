const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  open: { type: Number, default: 0 },
  high: { type: Number, default: 0 },
  low: { type: Number, default: 0 },
  close: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
  marketCap: { type: Number, default: 0 },
  peRatio: { type: Number, default: 0 },
  dividendYield: { type: Number, default: 0 },
  percentChange: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  aiInsights: { type: String, default: '' },
  sector: { type: String, default: '' },
  country: { type: String, default: '' },
  fiftyTwoWeekHigh: { type: Number, default: 0 },
  fiftyTwoWeekLow: { type: Number, default: 0 },
  averageVolume: { type: Number, default: 0 },
  beta: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Stock', stockSchema);