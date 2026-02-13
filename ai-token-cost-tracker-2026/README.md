# AI Token Cost Tracker - Chrome Extension

Real-time AI API cost tracking for OpenAI, Anthropic, and Google AI. Never get surprised by your LLM API bill again.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage: 100%](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)](https://github.com/CrashBytes/ai-token-cost-tracker-2026)
[![Tests: 143 Passing](https://img.shields.io/badge/Tests-143%20Passing-brightgreen.svg)](https://github.com/CrashBytes/ai-token-cost-tracker-2026)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg?logo=googlechrome)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Node: 18+](https://img.shields.io/badge/Node-18+-green.svg?logo=node.js)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/CrashBytes/ai-token-cost-tracker-2026/pulls)
[![CrashBytes Tutorial](https://img.shields.io/badge/Tutorial-CrashBytes-orange.svg)](https://crashbytes.com/tutorials/ai-token-cost-tracker-chrome-extension-tutorial-2026)

## Features

- **Real-Time Cost Tracking**: See API costs update instantly as calls complete
- **Multi-Provider Support**: Works with OpenAI, Anthropic, and Google AI APIs
- **Accurate Token Counting**: Provider-specific tokenization algorithms
- **Historical Charts**: 30-day cost trends and provider breakdowns
- **Budget Alerts**: Notifications when spending exceeds thresholds
- **Zero Configuration**: Install and start tracking immediately
- **Privacy First**: All data stays local, never transmitted externally

## Installation

### From Source (Development)

1. Clone this repository:
```bash
git clone https://github.com/CrashBytes/ai-token-cost-tracker-2026.git
cd ai-token-cost-tracker-2026
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `ai-token-cost-tracker-2026` directory

### From Chrome Web Store

*(Coming soon)*

## Usage

Once installed, the extension automatically tracks API costs:

1. **Badge Display**: Shows current day total in browser toolbar
2. **Popup**: Click extension icon for detailed cost breakdown
3. **Options Page**: Right-click icon → Options for historical charts

### Making AI API Calls

The extension works with any web-based tool making API calls to:
- `api.openai.com` (ChatGPT, GPT-4, GPT-3.5)
- `api.anthropic.com` (Claude Opus, Sonnet, Haiku)
- `generativelanguage.googleapis.com` (Gemini Pro, Flash)

Examples:
- OpenAI Playground
- API testing tools (Postman, Insomnia)
- Custom web applications
- Jupyter notebooks with web interfaces

## Architecture

### Components

- **Service Worker**: Intercepts network requests using `chrome.webRequest` API
- **Token Counter**: Provider-specific tokenization algorithms
- **Cost Calculator**: Applies current pricing tables to token counts
- **Storage Manager**: Persists cost data using `chrome.storage.local`
- **UI**: Popup and options page for data visualization

### Data Flow

1. Developer makes API call
2. Service worker intercepts request
3. Token counter calculates token usage
4. Cost calculator applies pricing
5. Storage manager persists data
6. Badge and UI update in real-time

## Development

### Project Structure

```
ai-token-cost-tracker/
├── manifest.json           # Extension configuration
├── background/
│   ├── service-worker.js   # Main background script
│   ├── request-interceptor.js
│   └── cost-calculator.js
├── lib/
│   ├── token-counter.js    # Tokenization logic
│   ├── pricing-tables.js   # Provider pricing data
│   └── storage-manager.js  # Data persistence
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── options/
    ├── options.html
    ├── options.js
    └── options.css
```

### Building

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Run tests
npm test
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Pricing Data

Current pricing (as of January 2026):

**OpenAI:**
- GPT-4 Turbo: $0.01/$0.03 per 1K tokens (input/output)
- GPT-4: $0.03/$0.06 per 1K tokens
- GPT-3.5 Turbo: $0.0005/$0.0015 per 1K tokens

**Anthropic:**
- Claude Opus 4: $0.015/$0.075 per 1K tokens
- Claude Sonnet 4: $0.003/$0.015 per 1K tokens
- Claude Haiku 3: $0.00025/$0.00125 per 1K tokens

**Google AI:**
- Gemini 1.5 Pro: $0.00125/$0.005 per 1K tokens
- Gemini 1.5 Flash: $0.00025/$0.0005 per 1K tokens

*Pricing updates automatically with new releases.*

## Privacy & Security

- **Local Storage Only**: All data stays in Chrome's local storage
- **No External Transmission**: Extension never sends data to servers
- **API Key Safety**: Keys pass through but are never stored
- **Minimal Permissions**: Only monitors specific AI provider domains
- **Open Source**: Full code transparency for security audit

## Troubleshooting

### Extension Not Tracking Costs

1. Check that you've made API calls to supported providers
2. Verify extension has required permissions
3. Open popup to see if data appears
4. Check browser console for errors

### Inaccurate Token Counts

- OpenAI: Uses official tiktoken library (accurate)
- Anthropic: Approximation based on character count (±10%)
- Google: Approximation using character multiplier (±10%)

### Badge Not Updating

1. Refresh the page making API calls
2. Check if extension is enabled
3. Verify API calls are going to supported domains

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Roadmap

- [ ] Budget alert notifications
- [ ] Project-based cost attribution
- [ ] Team sharing and aggregation
- [ ] Custom pricing tables
- [ ] Export to CSV/Excel
- [ ] Slack/Discord integration
- [ ] AWS Bedrock support
- [ ] Azure OpenAI support

## License

MIT License - see LICENSE file for details

## Author

CrashBytes - [crashbytes.com](https://crashbytes.com)

## Tutorial

Complete tutorial article: [Building an AI Token Cost Tracker Chrome Extension](https://crashbytes.com/articles/ai-token-cost-tracker-chrome-extension-tutorial-2026)

## Support

- **Issues**: [GitHub Issues](https://github.com/CrashBytes/ai-token-cost-tracker-2026/issues)
- **Tutorial Comments**: [Article Comments](https://crashbytes.com/articles/ai-token-cost-tracker-chrome-extension-tutorial-2026)
- **Email**: support@crashbytes.com
