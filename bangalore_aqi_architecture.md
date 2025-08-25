# Lightweight Bangalore Air Quality Dashboard

## Simplified Architecture for Small User Base

A minimal, cost-effective solution using free/Inexpensive weather services from IQAir and OpenWeather.

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
