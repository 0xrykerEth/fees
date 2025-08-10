const express = require('express');
const fetch = require('node-fetch');
const { DuneClient } = require('@duneanalytics/client-sdk');
const router = express.Router();

// Dune Analytics client configuration
const DUNE_API_KEY = process.env.DUNE_API_KEY;
let duneClient = null;

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function getCacheKey(endpoint, queryId) {
  return `${endpoint}_${queryId}`;
}

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for ${key}`);
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Remove expired cache
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, {
    data: data,
    timestamp: Date.now()
  });
}

// Initialize Dune client if API key is available
if (DUNE_API_KEY) {
  duneClient = new DuneClient(DUNE_API_KEY);
}

// Middleware to check API key
const checkDuneApiKey = (req, res, next) => {
  if (!DUNE_API_KEY || !duneClient) {
    return res.status(500).json({
      error: 'Dune API key not configured',
      message: 'Please set DUNE_API_KEY in your environment variables'
    });
  }
  next();
};

// Helper function to make Dune API requests using the official SDK
async function fetchDuneQuery(queryId) {
  try {
    console.log(`Fetching Dune query: ${queryId}`);
    const query_result = await duneClient.getLatestResult({ queryId: parseInt(queryId) });
    
    return {
      result: {
        rows: query_result.result?.rows || []
      },
      execution_time: query_result.execution_time_millis,
      query_id: queryId
    };
  } catch (error) {
    console.error('Dune API Error:', error.message);
    throw error;
  }
}

// GET /api/health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Lighter Exchange Calculator API',
    duneApiConfigured: !!DUNE_API_KEY
  });
});

// GET /api/depositors - Get total unique depositors
router.get('/depositors', checkDuneApiKey, async (req, res) => {
  try {
    // Use the correct query ID (5253927) or allow override via parameter
    const queryId = req.query.queryId || process.env.DEPOSITORS_QUERY_ID || '5253927';
    const cacheKey = getCacheKey('depositors', queryId);
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    console.log(`Fetching depositors data with query ID: ${queryId}`);
    const data = await fetchDuneQuery(queryId);
    
    const response = {
      success: true,
      data: data.result?.rows || [],
      query_id: queryId,
      execution_time: data.execution_time,
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    setCachedData(cacheKey, response);
    
    res.json(response);

  } catch (error) {
    console.error('Depositors API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch depositors data',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/tvl - Get TVL data
router.get('/tvl', checkDuneApiKey, async (req, res) => {
  try {
    // Use the new TVL query ID (5253928) or allow override via parameter
    const queryId = req.query.queryId || process.env.TVL_QUERY_ID || '5253928';
    
    if (!queryId) {
      return res.status(400).json({
        error: 'Missing query ID',
        message: 'Please provide queryId parameter or set TVL_QUERY_ID environment variable'
      });
    }
    
    const cacheKey = getCacheKey('tvl', queryId);
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    console.log(`Fetching TVL data with query ID: ${queryId}`);
    const data = await fetchDuneQuery(queryId);
    
    const response = {
      success: true,
      data: data.result?.rows || [],
      query_id: queryId,
      execution_time: data.execution_time,
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    setCachedData(cacheKey, response);
    
    res.json(response);

  } catch (error) {
    console.error('TVL API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch TVL data',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/tvl-history - Get TVL historical data over time
router.get('/tvl-history', checkDuneApiKey, async (req, res) => {
  try {
    const cacheKey = getCacheKey('tvl-history', '5253928');
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // This would need a different query that returns TVL over time
    // For now, we'll generate mock historical data based on current TVL
    const currentTvlResponse = await fetchDuneQuery('5253928');
    const currentTvl = currentTvlResponse.result?.rows?.[0]?.TVL || 224;
    
    // Generate mock historical data (replace with real historical query)
    const days = 30;
    const historicalData = [];
    const baseDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      // Generate realistic TVL fluctuation (replace with real data)
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const progressFactor = (days - i) / days; // Growth trend
      const tvlValue = (currentTvl * 0.7 * progressFactor) + (currentTvl * 0.3) + (currentTvl * variation * 0.1);
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        tvl: Math.max(0, tvlValue)
      });
    }
    
    const response = {
      success: true,
      data: historicalData,
      query_id: 'mock-historical',
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    setCachedData(cacheKey, response);
    
    res.json(response);

  } catch (error) {
    console.error('TVL History API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch TVL history',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/depositors-history - Get depositors historical data over time  
router.get('/depositors-history', checkDuneApiKey, async (req, res) => {
  try {
    const cacheKey = getCacheKey('depositors-history', '5253927');
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Generate mock historical depositor data (replace with real historical query)
    const currentDepositorsResponse = await fetchDuneQuery('5253927');
    const currentDepositors = currentDepositorsResponse.result?.rows?.[0]?.Dintinct_Depositors || 64507;
    
    const days = 30;
    const historicalData = [];
    const baseDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      // Generate realistic depositor growth (generally increasing)
      const progressFactor = (days - i) / days;
      const dailyGrowth = Math.random() * 100 + 50; // 50-150 new depositors per day
      const depositors = Math.floor(currentDepositors * 0.5 * progressFactor + currentDepositors * 0.5 + (Math.random() - 0.5) * 500);
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        depositors: Math.max(0, depositors)
      });
    }
    
    const response = {
      success: true,
      data: historicalData,
      query_id: 'mock-depositors-historical',
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    setCachedData(cacheKey, response);
    
    res.json(response);

  } catch (error) {
    console.error('Depositors History API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch depositors history',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/lighter-volume - Get Lighter Perp DEX volume
router.get('/lighter-volume', checkDuneApiKey, async (req, res) => {
  try {
    const cacheKey = getCacheKey('lighter-volume', 'volume');
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // For now, generate mock volume data (replace with real Dune query)
    const mockVolume = {
      volume24h: Math.random() * 10000000 + 5000000, // $5-15M daily volume
      volume7d: Math.random() * 50000000 + 25000000,  // $25-75M weekly
      trades24h: Math.floor(Math.random() * 1000 + 500), // 500-1500 trades
    };
    
    const response = {
      success: true,
      data: mockVolume,
      query_id: 'lighter-volume-mock',
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    setCachedData(cacheKey, response);
    
    res.json(response);

  } catch (error) {
    console.error('Lighter Volume API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch Lighter volume data',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/hyperliquid-volume - Get Hyperliquid volume
router.get('/hyperliquid-volume', async (req, res) => {
  try {
    const cacheKey = getCacheKey('hyperliquid-volume', 'api');
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Fetch from Hyperliquid API
    const hyperliquidResponse = await fetch('https://api.hyperliquid.xyz/info/meta');
    
    if (!hyperliquidResponse.ok) {
      throw new Error(`Hyperliquid API error: ${hyperliquidResponse.status}`);
    }
    
    const hyperliquidData = await hyperliquidResponse.json();
    
    // Calculate total volume across all markets
    const totalVolume24h = hyperliquidData.universe?.reduce((total, market) => {
      return total + parseFloat(market.dayNtlVlm || 0);
    }, 0) || 0;
    
    const response = {
      success: true,
      data: {
        volume24h: totalVolume24h,
        markets: hyperliquidData.universe?.length || 0,
        topMarkets: hyperliquidData.universe?.slice(0, 5).map(market => ({
          symbol: market.name,
          volume: parseFloat(market.dayNtlVlm || 0)
        })) || []
      },
      source: 'hyperliquid-api',
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    setCachedData(cacheKey, response);
    
    res.json(response);

  } catch (error) {
    console.error('Hyperliquid Volume API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch Hyperliquid volume data',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/deposits-timeline - Get deposits over time
router.get('/deposits-timeline', checkDuneApiKey, async (req, res) => {
  try {
    const queryId = req.query.queryId || process.env.DEPOSITS_TIMELINE_QUERY_ID;
    
    if (!queryId) {
      return res.status(400).json({
        error: 'Missing query ID',
        message: 'Please provide queryId parameter or set DEPOSITS_TIMELINE_QUERY_ID environment variable'
      });
    }

    const data = await fetchDuneQuery(queryId);
    
    res.json({
      success: true,
      data: data.result?.rows || [],
      query_id: queryId,
      execution_time: data.execution_time,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch deposits timeline',
      message: error.response?.data?.error || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/query - Execute arbitrary Dune query
router.post('/query', checkDuneApiKey, async (req, res) => {
  try {
    const { queryId } = req.body;
    
    if (!queryId) {
      return res.status(400).json({
        error: 'Missing query ID',
        message: 'Please provide queryId in request body'
      });
    }

    const data = await fetchDuneQuery(queryId);
    
    res.json({
      success: true,
      data: data.result?.rows || [],
      query_id: queryId,
      execution_time: data.execution_time,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to execute query',
      message: error.response?.data?.error || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/user/:address - Get user-specific data
router.get('/user/:address', checkDuneApiKey, async (req, res) => {
  try {
    const { address } = req.params;
    const queryId = req.query.queryId || process.env.USER_STATS_QUERY_ID;
    
    if (!queryId) {
      return res.status(400).json({
        error: 'Missing query ID',
        message: 'Please provide queryId parameter or set USER_STATS_QUERY_ID environment variable'
      });
    }

    // Note: For parameterized queries, you might need to use Dune's execute endpoint
    // This is a simplified version
    const data = await fetchDuneQuery(queryId);
    
    // Filter data for specific address (if not handled in query)
    const filteredData = data.result?.rows?.filter(row => 
      row.toAddress?.toLowerCase() === address.toLowerCase()
    ) || [];
    
    res.json({
      success: true,
      data: filteredData,
      user_address: address,
      query_id: queryId,
      execution_time: data.execution_time,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch user data',
      message: error.response?.data?.error || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// USDC Flow endpoint - Daily inflow and outflow data
router.get('/usdc-flow', checkDuneApiKey, async (req, res) => {
  try {
    const queryId = req.query.queryId || process.env.USDC_FLOW_QUERY_ID || '5253905';
    const cacheKey = getCacheKey('usdc-flow', queryId);
    
    // Try to get cached data first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    console.log(`Fetching USDC flow data from Dune query ${queryId}...`);
    const data = await fetchDuneQuery(queryId);
    
    if (!data.result?.rows || data.result.rows.length === 0) {
      return res.json({
        success: false,
        error: 'No USDC flow data available',
        data: [],
        timestamp: new Date().toISOString()
      });
    }
    
    // Process the flow data - using the new query structure
    const flowData = data.result.rows.map(row => ({
      date: row.period || row.date || row.day || row.Date,
      amount: parseFloat(row.amount || 0), // Net flow in millions
      daily_deposit_user: parseInt(row.daily_deposit_user || 0),
      daily_withdraw_user: parseInt(row.daily_withdraw_user || 0),
      cumulative_amount: parseFloat(row.cumulative_amount || 0),
      cumulative_amount_m: parseFloat(row.cumulative_amount_m || 0)
    }));
    
    // Sort by date
    flowData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const response = {
      success: true,
      data: flowData,
      query_id: queryId,
      execution_time: data.execution_time,
      timestamp: new Date().toISOString(),
      total_days: flowData.length
    };
    
    // Cache the response
    setCachedData(cacheKey, response);
    
    res.json(response);
  } catch (error) {
    console.error('USDC Flow API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch USDC flow data',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});



// Lighter Exchange Stats API proxy
router.get('/lighter-exchange-stats', async (req, res) => {
  try {
    console.log('📊 Fetching Lighter exchange statistics');
    
    const response = await fetch('https://mainnet.zklighter.elliot.ai/api/v1/exchangeStats');
    
    if (!response.ok) {
      throw new Error(`Lighter API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Lighter exchange stats retrieved');
    
    // Process and format the data for our dashboard
    const processedData = {
      daily_usd_volume: data.daily_usd_volume || 0,
      daily_trades_count: data.daily_trades_count || 0,
      total_markets: data.total || 0,
      markets: data.order_book_stats || [],
      last_updated: new Date().toISOString(),
      // Add additional market insights
      top_volume_market: data.order_book_stats && data.order_book_stats.length > 0
        ? data.order_book_stats.reduce((max, market) => 
            parseFloat(market.daily_quote_token_volume || 0) > parseFloat(max.daily_quote_token_volume || 0) ? market : max
          )
        : null
    };
    
    res.json(processedData);
  } catch (error) {
    console.error('❌ Error fetching Lighter exchange stats:', error);
    res.status(500).json({
      error: 'Failed to fetch exchange statistics',
      details: error.message
    });
  }
});



// Lighter Account API proxy
router.get('/lighter-account/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address format'
      });
    }

    console.log(`📊 Fetching Lighter account data for address: ${address}`);
    
    const response = await fetch(`https://mainnet.zklighter.elliot.ai/api/v1/account?by=l1_address&value=${address}`);
    
    if (!response.ok) {
      // Try to get error details from response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      
      // Handle specific Lighter API error codes
      if (response.status === 400 && errorData.code === 21100) {
        console.log(`⚠️  Account not found for ${address} - user hasn't used Lighter protocol`);
        return res.status(404).json({
          error: 'Account not found',
          message: 'This address has not used the Lighter protocol yet. Try a different address or create an account on Lighter first.',
          code: 21100
        });
      }
      
      throw new Error(`Lighter API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log(`✅ Lighter account data retrieved for ${address}`);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching Lighter account data:', error);
    res.status(500).json({
      error: 'Failed to fetch account data',
      details: error.message
    });
  }
});

module.exports = router;
