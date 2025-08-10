# Lighter Exchange Fee Calculator

A modern Express.js application for calculating exchange fees and displaying analytics for the Lighter Protocol using Dune Analytics integration.

## 🚀 Features

- **Fee Calculator**: Compare trading fees across multiple exchanges
- **TVL Dashboard**: Real-time total unique depositors using Dune Analytics
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Theme**: Toggle between themes
- **Dune Analytics Integration**: Live data from blockchain analytics

## 📊 Current Implementation

### Main Calculator (`/`)
- Exchange fee comparison tool
- Staking tier calculations for HYPE, BNB, and DRIFT tokens
- Interactive charts showing fee comparisons
- Mobile-responsive design

### TVL Dashboard (`/tvl-dashboard`)
- Displays total unique depositors from Lighter Protocol
- Uses the Dune query: `SELECT COUNT(DISTINCT(toAddress)) AS Distinct_Depositors FROM lighter_v2_ethereum.zklighter_evt_deposit`
- Real-time data visualization with Chart.js
- Auto-refresh every 30 seconds

### Account Stats (`/stats`)
- Coming soon placeholder page
- Planned features for user-specific analytics

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file with:
```env
# Get your API key from: https://dune.com/settings/api
DUNE_API_KEY=your_dune_api_key_here

# Query ID for total depositors (correct query that shows ~70k depositors)
DEPOSITORS_QUERY_ID=5253927

PORT=3000
NODE_ENV=development
```

3. **Start the server:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

4. **Visit the application:**
Open http://localhost:3000 in your browser

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and Dune API configuration status.

### Depositors Data
```
GET /api/depositors?queryId=YOUR_QUERY_ID
```
Fetches total unique depositors from Dune Analytics.

### Generic Query Execution
```
POST /api/query
Body: { "queryId": "YOUR_QUERY_ID" }
```
Execute any Dune query by ID.

### User-Specific Data
```
GET /api/user/:address?queryId=YOUR_QUERY_ID
```
Fetch data for a specific wallet address.

## 📈 Dune Analytics Integration

### Setting Up Dune Queries

1. **Create a Dune Analytics account** at https://dune.com
2. **The depositors query is already created** with Query ID: `5253927`
   ```sql
   SELECT COUNT(DISTINCT(toAddress)) AS Distinct_Depositors 
   FROM lighter_v2_ethereum.zklighter_evt_deposit;
   ```
3. **Get your API key** from https://dune.com/settings/api
4. **Set environment variables** with your API key:
   ```env
   DUNE_API_KEY=your_actual_api_key
   DEPOSITORS_QUERY_ID=5253927
   ```

### Using the Official Dune SDK

This application now uses the official `@duneanalytics/client-sdk` instead of direct API calls:

```javascript
const { DuneClient } = require('@duneanalytics/client-sdk');
const dune = new DuneClient(API_KEY);
const query_result = await dune.getLatestResult({queryId: 5253927});
```

### Example Queries for Lighter Protocol

```sql
-- Total unique depositors
SELECT COUNT(DISTINCT(toAddress)) AS Distinct_Depositors 
FROM lighter_v2_ethereum.zklighter_evt_deposit;

-- Depositor growth over time
SELECT 
    DATE_TRUNC('day', evt_block_time) as date,
    COUNT(DISTINCT toAddress) as daily_new_depositors,
    SUM(COUNT(DISTINCT toAddress)) OVER (ORDER BY DATE_TRUNC('day', evt_block_time)) as cumulative_depositors
FROM lighter_v2_ethereum.zklighter_evt_deposit
GROUP BY 1
ORDER BY date;

-- Deposit volume by token
SELECT 
    token_address,
    SUM(amount / 1e18) as total_amount,
    COUNT(DISTINCT toAddress) as unique_depositors
FROM lighter_v2_ethereum.zklighter_evt_deposit
GROUP BY token_address
ORDER BY total_amount DESC;
```

## 🏗️ Project Structure

```
fees/
├── server.js              # Express server setup
├── package.json           # Dependencies and scripts
├── routes/
│   └── api.js             # API routes for Dune integration
├── public/                # Static HTML files
│   ├── index.html         # Main calculator page
│   ├── tvl-dashboard.html # TVL dashboard
│   └── stats.html         # Account stats (coming soon)
└── README.md             # This file
```

## 🔧 Development

### Adding New Features

1. **Add new API endpoints** in `routes/api.js`
2. **Create new HTML pages** in `public/` directory
3. **Add routes** in `server.js` if needed
4. **Update navigation** in existing HTML files

### Environment Variables

- `DUNE_API_KEY`: Your Dune Analytics API key
- `DEPOSITORS_QUERY_ID`: Query ID for the depositors count query
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### API Error Handling

The API includes comprehensive error handling:
- Missing API key detection
- Dune API timeout handling (30s)
- Proper HTTP status codes
- User-friendly error messages

## 📱 Responsive Design

- Mobile-first approach
- Flexible navigation that adapts to screen size
- Chart.js responsive charts
- Dark/light theme support

## 🚀 Deployment

### For production deployment:

1. Set `NODE_ENV=production`
2. Configure your Dune API key
3. Set up your Dune queries and get their IDs
4. Deploy to your preferred platform (Vercel, Heroku, etc.)

### Security Features

- Helmet.js for security headers
- CORS configuration
- Environment variable protection
- Content Security Policy for external resources

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your Dune API key
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

## 🔗 Useful Links

- [Dune Analytics](https://dune.com)
- [Lighter Protocol](https://lighter.xyz)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Express.js Guide](https://expressjs.com/)
