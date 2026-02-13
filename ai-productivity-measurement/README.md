# AI Productivity Measurement Framework

A comprehensive system for measuring enterprise AI productivity with multi-dimensional metrics, ROI calculation, and actionable insights.

## Overview

This framework provides production-ready tools to measure AI productivity beyond simple time savings. Track efficiency, quality, costs, and business impact across your organization with sophisticated analytics that account for adoption curves, quality tradeoffs, and hidden costs.

**Key Features:**
- Multi-dimensional productivity metrics (efficiency, quality, adoption, financial)
- Sophisticated ROI calculation with risk adjustment
- Real-time dashboards for multiple stakeholder groups
- Feedback loop system for continuous improvement
- Privacy-preserving instrumentation
- Industry-standard measurement methodologies

## Architecture

The system consists of five integrated components:

1. **Instrumentation Layer** - Captures AI interactions without disrupting workflows
2. **Metrics Engine** - Transforms raw logs into meaningful productivity indicators
3. **ROI Calculator** - Connects metrics to financial outcomes with honest modeling
4. **Dashboard System** - Visualizes insights for different stakeholder groups
5. **Feedback Loop** - Connects insights to deployment decisions

## Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Redis (optional, for caching)
- Docker and Docker Compose (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/MichaelEakins/ai-productivity-measurement.git
cd ai-productivity-measurement

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
psql -U postgres -f database/schema.sql

# Configure environment
cp config/example.env .env
# Edit .env with your database credentials and API keys

# Run database migrations
python scripts/migrate.py

# Start the API server
uvicorn api.main:app --reload

# In another terminal, start the dashboard
cd dashboard
npm install
npm run dev
```

Visit `http://localhost:3000` for the dashboard and `http://localhost:8000/docs` for API documentation.

### Docker Quick Start

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, the API server, and the dashboard. Visit `http://localhost:3000`.

## Configuration

The system is configured through environment variables. Copy `config/example.env` to `.env` and customize:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_productivity

# API Keys (for instrumenting AI platforms)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# ROI Calculator Defaults
AVERAGE_HOURLY_WAGE=75.00
FULLY_LOADED_LABOR_RATE=125.00
LICENSING_COST_ANNUAL=120000.00

# Metrics Collection
BUFFER_SIZE=100
FLUSH_INTERVAL_SECONDS=60
```

## Usage

### Instrumenting AI Tools

```python
from instrumentation.logger import ProductivityLogger, AIInteraction

# Initialize logger
logger = ProductivityLogger(connection_string=DATABASE_URL)

# Log an interaction
interaction = AIInteraction(
    tool_name="ChatGPT",
    task_type="code_review",
    user_id="user_123",
    input_tokens=500,
    output_tokens=300,
    duration_ms=2500,
    model_name="gpt-4",
    completion_status="success"
)

await logger.log_interaction(interaction)
```

### Calculating Metrics

```python
from metrics.engine import MetricsEngine

engine = MetricsEngine(logger)

# Calculate user productivity metrics
metrics = engine.calculate_user_metrics(
    user_id="user_123",
    start_date=datetime(2025, 11, 1),
    end_date=datetime(2025, 12, 1),
    baseline_data={"avg_task_duration_ms": 300000}
)

print(f"Productivity ratio: {metrics.productivity_ratio}")
print(f"Time saved: {metrics.time_savings_ms / 3600000} hours")
```

### Calculating ROI

```python
from roi.calculator import ROICalculator, ROICalculatorConfig

config = ROICalculatorConfig(
    licensing_cost_annual=120000,
    implementation_cost_onetime=50000,
    training_cost_per_user=500,
    ongoing_support_cost_annual=25000,
    infrastructure_cost_annual=15000,
    avg_hourly_wage=75,
    fully_loaded_labor_rate=125
)

calculator = ROICalculator(config)

roi_result = calculator.calculate_roi(
    user_count=100,
    metrics={
        'avg_time_saved_hours_per_user_per_month': 8,
        'quality_improvement_factor': 1.15,
        'error_rate_reduction': 12,
        'adoption_rate': 0.75
    },
    period_months=12
)

print(f"ROI: {roi_result.roi_percentage:.1f}%")
print(f"Payback period: {roi_result.payback_period_months:.1f} months")
```

### API Endpoints

The REST API provides comprehensive access to metrics:

```bash
# Get user metrics
curl http://localhost:8000/api/metrics/user/user_123

# Get team metrics
curl http://localhost:8000/api/metrics/team?team_id=engineering

# Calculate ROI
curl http://localhost:8000/api/roi?user_count=100&period_months=12

# Get trends
curl http://localhost:8000/api/trends?metric_name=productivity_ratio&user_id=user_123
```

See full API documentation at `http://localhost:8000/docs`.

## Dashboard

The dashboard provides role-specific views:

- **Engineer View**: Task-level analytics, tool performance, workflow optimization
- **Manager View**: Team trends, adoption patterns, training opportunities
- **Finance View**: Cost-benefit analysis, ROI projections, spend optimization
- **Executive View**: Strategic impact, competitive positioning, high-level trends

## Deployment

### Production Deployment

1. **Database Setup**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
2. **API Deployment**: Deploy FastAPI app to container platform (ECS, Cloud Run, etc.)
3. **Dashboard**: Build and deploy React app to CDN (Cloudflare Pages, Vercel, etc.)
4. **Monitoring**: Set up application monitoring (DataDog, New Relic, etc.)

See `docs/deployment.md` for detailed production deployment guide.

### Security Considerations

- All user IDs are hashed before storage
- PII is never logged in interaction data
- API requires authentication tokens
- Database uses row-level security
- Audit logs track all metric access

## Customization

### Adding Custom Metrics

```python
from metrics.engine import MetricsEngine

class CustomMetricsEngine(MetricsEngine):
    def calculate_custom_metric(self, user_id, start, end):
        # Your custom calculation logic
        return custom_value
```

### Custom Dashboard Views

Dashboard components are in `dashboard/src/components/`. Add new visualizations by creating React components that consume the API.

### Integration with Existing Systems

The framework provides adapters for common enterprise systems:

- JIRA/Linear for task tracking integration
- Slack/Teams for notification integration
- Workday/BambooHR for org structure integration
- Salesforce for customer impact tracking

See `docs/integrations.md` for implementation guides.

## Testing

```bash
# Run unit tests
pytest tests/unit/

# Run integration tests
pytest tests/integration/

# Run with coverage
pytest --cov=. --cov-report=html

# Load testing
locust -f tests/load/locustfile.py
```

## Documentation

- **Tutorial**: See [crashbytes.com/articles/measuring-ai-productivity-roi-tutorial](https://crashbytes.com/articles/measuring-ai-productivity-roi-tutorial)
- **API Reference**: `http://localhost:8000/docs` when running
- **Architecture Guide**: `docs/architecture.md`
- **Deployment Guide**: `docs/deployment.md`
- **Integration Guide**: `docs/integrations.md`
- **Troubleshooting**: `docs/troubleshooting.md`

## Contributing

Contributions welcome! Please read `CONTRIBUTING.md` for guidelines.

Key areas for contribution:
- Additional AI platform integrations
- Dashboard visualizations
- Custom metric implementations
- Documentation improvements

## License

MIT License - see LICENSE file for details.

## Citation

If you use this framework in research or production, please cite:

```
Eakins, M. (2025). AI Productivity Measurement Framework. 
GitHub: https://github.com/MichaelEakins/ai-productivity-measurement
Blog: https://crashbytes.com/articles/measuring-ai-productivity-roi-tutorial
```

## Support

- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and community support
- **Blog**: [crashbytes.com](https://crashbytes.com) for updates and analysis

## Roadmap

**Q1 2026:**
- Machine learning-based quality assessment
- Automated baseline calibration
- Multi-tenant support for consultants

**Q2 2026:**
- Real-time anomaly detection
- Predictive ROI modeling
- Integration marketplace

**Q3 2026:**
- Industry benchmark database
- AI-powered insight generation
- Mobile dashboard apps

## Related Projects

- [OpenAI Evals](https://github.com/openai/evals) - AI model evaluation
- [DORA Metrics](https://www.devops-research.com/research.html) - DevOps performance
- [Lighthouse](https://github.com/GoogleChrome/lighthouse) - Web performance

## Acknowledgments

Built in response to OpenAI's State of Enterprise AI 2025 report showing 8x usage growth and 40-60 minute daily time savings. This framework helps enterprises validate those claims in their specific context.

---

**Status**: Production-ready v1.0  
**Author**: Michael Eakins ([CrashBytes](https://crashbytes.com))  
**Last Updated**: December 8, 2025
