# VyomSetu Backend - Vercel Deployment Guide

## Deployment to Vercel

### Prerequisites
- Vercel CLI installed (`npm i -g vercel`)
- Python 3.11+ runtime
- Git repository connected to GitHub

### Quick Start - Deploy

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Navigate to project root**:
   ```bash
   cd vyomsetu-engine
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

### Local Testing

1. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Run locally**:
   ```bash
   cd backend
   vercel dev
   ```

   Or with uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Test endpoints**:
   - Calculate Plan: `POST /calculate-plan`
   - Weather Resilience: `GET /weather-resilience/{village_id}`
   - Reroute Network: `POST /reroute-network`

### API Endpoints

All endpoints are served from the root path when deployed:

- **POST** `/api/calculate-plan` - Calculate network plan
- **GET** `/api/weather-resilience/{village_id}` - Get weather resilience data
- **POST** `/api/reroute-network` - Reroute network around dead nodes

### Environment Variables

Currently, the application doesn't require environment variables. Add them to Vercel dashboard if needed in future.

### Project Structure

```
backend/
├── api/
│   ├── index.py                 # Main ASGI app entry point
│   ├── calculate_plan.py        # Calculate plan endpoint
│   ├── weather_resilience.py    # Weather resilience endpoint
│   └── reroute_network.py       # Reroute network endpoint
├── main.py                      # Core application logic
├── weather.py                   # Weather/resilience simulation
├── requirements.txt             # Python dependencies
├── vercel.json                  # Vercel configuration
└── README.md                    # This file
```

### Troubleshooting

**Module Import Errors**:
- Ensure all imports use absolute paths
- Check that `sys.path.append()` correctly points to parent directory

**Timeout Errors**:
- Default timeout is 30 seconds
- Edit `vercel.json` `maxDuration` to increase if needed (max 60 for Hobby, 900 for Pro)

**Large Dependencies**:
- Lambda size limited to 15MB (configured in `vercel.json`)
- Remove unnecessary dependencies if approaching limit

### Auto-Deployment

Once connected to GitHub, Vercel automatically deploys on:
- Push to main branch
- Pull request creation

Check deployment logs in Vercel dashboard.
