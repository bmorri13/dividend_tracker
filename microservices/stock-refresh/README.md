# Stock Refresh Microservice

A Go microservice that refreshes current stock prices and dividend yields for all holdings in the dividend tracker portfolio.

## Features

- Fetches current stock prices from Financial Modeling Prep API
- Calculates updated dividend yields based on recent dividend data
- Updates portfolio_holdings table with new values
- Provides detailed output showing which stocks were changed
- Respects API rate limits with built-in delays
- Perfect for cronjob automation

## Quick Start

### Build Options

#### Option 1: Go Binary

```bash
# Navigate to the microservice directory
cd microservices/stock-refresh

# Build the binary
./build.sh

# Run manually
./stock-refresh
```

#### Option 2: Docker Container

```bash
# Navigate to the microservice directory
cd microservices/stock-refresh

# Build Docker image
./build.sh docker

# Run once
docker run --rm --env-file ../../.env stock-refresh

# Run in background
docker run -d --name stock-refresh-job --env-file ../../.env stock-refresh

# Check logs
docker logs stock-refresh-job

# Stop background job
docker stop stock-refresh-job && docker rm stock-refresh-job
```

### Setup Cronjob

#### Binary Cronjob

```bash
# Edit your crontab
crontab -e

# Add a line for daily refresh at 6 PM
0 18 * * * cd /path/to/dividend_tracker/microservices/stock-refresh && ./stock-refresh >> refresh.log 2>&1
```

#### Docker Cronjob

```bash
# Edit your crontab
crontab -e

# Add a line for daily refresh at 6 PM using Docker
0 18 * * * docker run --rm --env-file /path/to/dividend_tracker/.env stock-refresh >> /path/to/dividend_tracker/microservices/stock-refresh/refresh.log 2>&1
```

See `cron-example.txt` for more scheduling examples.

## Environment Variables

The service requires the following environment variables (typically in the root `.env` file):

- `DATABASE_URL` - PostgreSQL connection string to Supabase database
- `FMP_API_KEY` - Financial Modeling Prep API key

## Output

The service provides detailed output including:

- Total holdings processed
- Number of holdings updated vs unchanged
- For each holding:
  - Current status (UPDATED/UNCHANGED)
  - Price changes with percentage
  - Dividend yield changes
  - Fields that were updated

### Example Output

```
🚀 Starting stock refresh service...
📊 Connected to database successfully
📈 Found 6 holdings to refresh
Processing AAPL (Apple Inc.)...
✅ Updated AAPL: Price 214.15→216.45, Yield 0.47%→0.46%
Processing DIS (The Walt Disney Company)...
➡️  No changes for DIS
...

🎉 Refresh completed!
📊 Total holdings processed: 6
🔄 Holdings updated: 3
⚡ Holdings unchanged: 3

📋 Detailed Results:
==================
AAPL   Apple Inc.           UPDATED
       Price: $214.15 → $216.45 (1.07%)
       Yield: 0.47% → 0.46%
       Fields updated: [current_price total_value dividend_yield monthly_dividend]

DIS    The Walt Disney Co.  UNCHANGED
...
```

## Database Updates

The service updates the following fields in the `portfolio_holdings` table:

- `current_price` - Latest stock price
- `dividend_yield` - Calculated dividend yield percentage
- `total_value` - Recalculated as `current_price * shares`
- `monthly_dividend` - Recalculated monthly dividend income
- `updated_at` - Timestamp of the update

## API Rate Limiting

- Built-in 200ms delay between API calls
- Handles API errors gracefully
- Continues processing even if individual stocks fail

## Advanced Docker Usage

### Running with Custom Environment

```bash
# Run with specific environment variables
docker run --rm \
  -e DATABASE_URL="your_database_url" \
  -e FMP_API_KEY="your_api_key" \
  stock-refresh

# Run with volume mount for logs
docker run --rm \
  --env-file ../../.env \
  -v $(pwd):/app/logs \
  stock-refresh
```

### Development and Debugging

```bash
# Run interactively with shell access
docker run --rm -it --env-file ../../.env stock-refresh sh

# Run with debug output
docker run --rm --env-file ../../.env stock-refresh 2>&1 | tee debug.log
```

## Cronjob Scheduling Examples

### Binary Cronjobs

```bash
# Daily at 6 PM
0 18 * * * cd /path/to/dividend_tracker/microservices/stock-refresh && ./stock-refresh >> refresh.log 2>&1

# Weekdays at market close (4:30 PM EST)
30 16 * * 1-5 cd /path/to/dividend_tracker/microservices/stock-refresh && ./stock-refresh >> refresh.log 2>&1

# Weekly on Sundays at 8 PM
0 20 * * 0 cd /path/to/dividend_tracker/microservices/stock-refresh && ./stock-refresh >> refresh.log 2>&1
```

### Docker Cronjobs

```bash
# Daily at 6 PM using Docker
0 18 * * * docker run --rm --env-file /path/to/dividend_tracker/.env stock-refresh >> /path/to/dividend_tracker/microservices/stock-refresh/refresh.log 2>&1

# Weekdays at market close using Docker
30 16 * * 1-5 docker run --rm --env-file /path/to/dividend_tracker/.env stock-refresh >> /path/to/dividend_tracker/microservices/stock-refresh/refresh.log 2>&1

# Weekly refresh with cleanup
0 20 * * 0 docker run --rm --env-file /path/to/dividend_tracker/.env stock-refresh && docker system prune -f
```

For more examples, see `cron-example.txt`.