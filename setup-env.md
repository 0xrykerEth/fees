# Environment Setup

Create a `.env` file in the root directory with the following content:

```env
# Dune Analytics Configuration
# Get your API key from: https://dune.com/settings/api
DUNE_API_KEY=your_actual_dune_api_key_here

# Query ID for total depositors (Query ID: 5253927)
# This query shows the correct ~70k depositors count
DEPOSITORS_QUERY_ID=5253927

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Steps to get your Dune API Key:

1. Go to https://dune.com/settings/api
2. Create a new API key
3. Copy the key and replace `your_actual_dune_api_key_here` in the .env file
4. Save the .env file
5. Restart the server with `npm start`

## Testing the API:

Once you have the API key set up, you can test:

1. Health check: `curl http://localhost:3000/api/health`
2. Depositors data: `curl http://localhost:3000/api/depositors`

The TVL dashboard at http://localhost:3000/tvl-dashboard will then show the real ~70k depositors count instead of the demo data.
