# Lightweight Bangalore Air Quality Dashboard

## Simplified Architecture for Small User Base

A minimal, cost-effective solution using free/cheap services with OpenRouter/HuggingFace LLMs.

## Core Components

### 1. Static Site + Serverless Functions

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel/Netlify│    │  GitHub Actions  │    │   JSON Files    │
│   (Frontend +   │────│  (Data Pipeline) │────│   (Data Store)  │
│   Serverless)   │    │  (Runs 2x/day)   │    │   (Git Repo)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Monthly Cost: $0** (Free tiers)

### 2. Data Collection Strategy

#### Simple Python Script (Runs on GitHub Actions)
```python
# collect_data.py - Runs every 12 hours
import requests
import json
from datetime import datetime
import os

class SimpleAQICollector:
    def __init__(self):
        self.openrouter_key = os.getenv('OPENROUTER_API_KEY')  # Free tier
        
    def collect_all_sources(self):
        data = {
            "last_updated": datetime.now().isoformat(),
            "locations": {}
        }
        
        # 1. Free API sources
        data["locations"].update(self.get_openweather_data())
        data["locations"].update(self.get_aqicn_data())  # Free API
        
        # 2. Web scraping
        data["locations"].update(self.scrape_simple_sources())
        
        # 3. PDF processing (only when new PDFs detected)
        pdf_data = self.process_new_pdfs()
        if pdf_data:
            data["locations"].update(pdf_data)
            
        # Save to JSON file
        with open('data/aqi_data.json', 'w') as f:
            json.dump(data, f, indent=2)
            
        return data
    
    def process_new_pdfs(self):
        # Check for new PDFs from known sources
        # Use OpenRouter with free models for extraction
        pass
```

### 3. Free/Cheap Data Sources

#### A. Free APIs (No LLM needed)
- **World Air Quality Index API** (aqicn.org) - Free 1000 calls/day
- **OpenWeatherMap Air Pollution API** - Free 1000 calls/day
- **IQAir API** - Free tier available

#### B. Simple Web Scraping
- SAFAR India website (structured data)
- CPCB dashboard (basic scraping)

#### C. PDF Processing (OpenRouter Free Tier)
```python
def process_pdf_with_openrouter(self, pdf_text):
    # Use free models like Mixtral or Llama
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {self.openrouter_key}"},
        json={
            "model": "mistralai/mixtral-8x7b-instruct:free",  # Free tier
            "messages": [
                {
                    "role": "user", 
                    "content": f"""Extract Bangalore air quality data from this text. 
                    Return only JSON format:
                    {{
                        "locations": [
                            {{"area": "location_name", "aqi": number, "timestamp": "ISO_date"}}
                        ]
                    }}
                    
                    Text: {pdf_text[:2000]}"""  # Limit tokens
                }
            ]
        }
    )
    return response.json()
```

### 4. Ultra-Simple Frontend

#### Single HTML + JavaScript Dashboard
```html
<!DOCTYPE html>
<html>
<head>
    <title>Bangalore Air Quality</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        /* Simple CSS with CSS Grid */
        body { font-family: system-ui; margin: 0; padding: 20px; }
        .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .aqi-good { background: #4CAF50; color: white; }
        .aqi-moderate { background: #FF9800; color: white; }
        .aqi-poor { background: #F44336; color: white; }
        #map { height: 300px; }
    </style>
</head>
<body>
    <h1>Bangalore Air Quality Dashboard</h1>
    <div id="last-updated"></div>
    
    <div class="dashboard">
        <div class="card">
            <h3>Current AQI</h3>
            <div id="current-aqi"></div>
        </div>
        
        <div class="card">
            <h3>Locations</h3>
            <div id="map"></div>
        </div>
        
        <div class="card">
            <h3>Trend (Last 7 Days)</h3>
            <canvas id="trend-chart"></canvas>
        </div>
        
        <div class="card">
            <h3>Data Sources</h3>
            <ul id="sources-list"></ul>
        </div>
    </div>

    <script>
        // Fetch data from JSON file and render dashboard
        async function loadDashboard() {
            const response = await fetch('./data/aqi_data.json');
            const data = await response.json();
            
            renderCurrentAQI(data);
            renderMap(data);
            renderTrend(data);
            renderSources(data);
        }
        
        // Simple rendering functions
        function renderCurrentAQI(data) {
            // Calculate average AQI and display
        }
        
        loadDashboard();
        // Auto-refresh every 30 minutes
        setInterval(loadDashboard, 30 * 60 * 1000);
    </script>
</body>
</html>
```

### 5. GitHub Actions Workflow

```yaml
# .github/workflows/collect-data.yml
name: Collect Air Quality Data

on:
  schedule:
    - cron: '0 */12 * * *'  # Every 12 hours
  workflow_dispatch:  # Manual trigger

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v3
        with:
          python-version: '3.11'
          
      - name: Install dependencies
        run: |
          pip install requests beautifulsoup4 PyPDF2
          
      - name: Collect data
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: python collect_data.py
        
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/aqi_data.json
          git commit -m "Update AQI data $(date)" || exit 0
          git push
```

### 6. Hosting Options (Free/Very Cheap)

#### Option 1: GitHub Pages (Free)
- Host static site directly from GitHub repo
- Data updates via GitHub Actions
- Custom domain supported
- **Cost: $0/month**

#### Option 2: Vercel (Free Tier)
- Automatic deployments from GitHub
- Serverless functions for API endpoints
- Better performance than GitHub Pages
- **Cost: $0/month** (hobby plan)

#### Option 3: Netlify (Free Tier)
- Similar to Vercel
- Form handling
- Edge functions
- **Cost: $0/month**

### 7. Directory Structure

```
bangalore-aqi-dashboard/
├── index.html              # Main dashboard
├── data/
│   ├── aqi_data.json      # Current data
│   └── historical/         # Daily backups
├── scripts/
│   ├── collect_data.py    # Data collection
│   ├── pdf_processor.py   # PDF handling
│   └── sources.json       # Data source configs
├── .github/workflows/
│   └── collect-data.yml   # GitHub Actions
├── README.md
└── requirements.txt
```

### 8. OpenRouter/HuggingFace Integration

#### Free Model Options
```python
# OpenRouter Free Tier Models
FREE_MODELS = [
    "mistralai/mixtral-8x7b-instruct:free",
    "google/gemma-7b-it:free",
    "microsoft/wizardlm-2-8x22b:free"
]

# HuggingFace Inference API (Free)
def process_with_hf(text):
    response = requests.post(
        "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        json={"inputs": text}
    )
    return response.json()
```

### 9. Essential Features Only

#### Dashboard Components
1. **Current AQI Summary** - Average across all sources
2. **Simple Map** - Bangalore locations with color-coded pins
3. **7-Day Trend** - Basic line chart
4. **Data Source Status** - Which sources are working

#### Data Processing
1. **Standardization** - Convert all sources to common format
2. **Basic Validation** - Remove obvious outliers
3. **Simple Averaging** - Combine multiple sources per location

### 10. Implementation Timeline

#### Week 1: MVP Setup
- Set up GitHub repo with Actions
- Implement 2-3 free API sources
- Create basic HTML dashboard
- Deploy to GitHub Pages

#### Week 2: Add Intelligence
- Add OpenRouter PDF processing
- Implement simple web scraping
- Add basic data validation
- Style improvements

#### Week 3: Polish
- Add more data sources
- Improve error handling
- Add data quality indicators
- Mobile responsiveness

### 11. Total Monthly Costs

- **Hosting:** $0 (GitHub Pages/Vercel/Netlify free tier)
- **LLM APIs:** $0-5 (OpenRouter free tier + minimal usage)
- **External APIs:** $0 (all free tiers)
- **Total: $0-5/month**

### 12. Scaling Strategy

If the user base grows:
1. Move to Vercel Pro ($20/month)
2. Add PostgreSQL database (Railway $5/month)
3. Implement user authentication
4. Add email alerts

This approach gives you 80% of the functionality with 5% of the complexity and cost!