# AETools

<div align='center'>
  <img src="./blob/logo.png" width="250" alt="AETools Logo" />
  
  ![Built With Discord](https://img.shields.io/badge/created_with-discord.js_v14-blue)
  ![License](https://img.shields.io/badge/license-AGPL3.0-green)
  ![Status Badge](https://img.shields.io/endpoint?url=https%3A%2F%2Faetools.koyeb.app%2Fapi%2Fheartbeat)
</div>

## Overview

AETools is a comprehensive Discord bot and web application designed for Warframe community management. It provides tools for relic tracking, squad hosting, resource management, and more. The project combines a Discord bot interface with a web-based explorer for enhanced functionality.

## Discord Bot Features
- **Relic Management**
  - View relic information using `++RELIC NAME` or shorthand syntax
  - Track relic stock and status (ED/ORANGE/RED/YELLOW/GREEN)
  - Prime set and part tracking
  - Relic soup generation and management

- **Squad Hosting**
  - Treasury runs (deprecated)
  - Farmer runs with resource tracking
  - Automated squad management

- **Resource Management**
  - Clan resource tracking
  - Stock monitoring
  - Resource availability checking

## Web Interface
- **Relic Explorer** (`/explorer`)
  - Real-time relic data visualization
  - Interactive search and filtering
  - Detailed relic information
  - Stock tracking and status updates

- **About Page** (`/`)
  - Project documentation
  - Feature overview
  - Usage instructions

## Usage

### Discord Commands
- Relic Viewing: `++RELIC NAME` or `++SHORTHAND`
- Squad Hosting: `/thost` or `/fhost`
- Resource Checking: `/resource` or `/clan`
- Relic Soup: `/soup` or `/resoup`

### Web Interface
- Visit `http://aetools.koyeb.app` for the about page
- Visit `http://aetools.koyeb.app/explorer` for the relic explorer
- Visit `http://aetools.koyeb.app/tutorial` for the tutorial

## Technical Architecture

### Project Structure

```
project-root/
├── src/ # Main source code
│ ├── commands/ # Discord bot commands
│ ├── data/ # Data storage and models
│ ├── events/ # Discord event handlers
│ ├── managers/ # Business logic managers
│ ├── services/ # External service integrations
│ ├── web/ # Web interface
│ │ ├── public/ # Static assets
│ │ └── views/ # HTML templates
│ └── other/ # Utility functions
├── scripts/ # Server and API endpoints
│ ├── api/ # API routes and controllers
│ └── server.js # Express server setup
└── blob/ # Static assets
```


### Key Technologies
- **Backend**
  - Node.js
  - Express.js
  - Discord.js v14
  - MongoDB (via Mongoose)
  - Google Sheets API

- **Frontend**
  - HTML/CSS
  - JavaScript
  - Express static file serving

### API Endpoints
- `/api/explorer` - Relic data endpoint
- `/api/forceupdate` - Manual data update trigger
- `/api/fissure` - Fissure tracking endpoint
- `/api/heartbeat` - Service status endpoint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Discord Bot Token
- Google Sheets API credentials

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/UnKnownnPasta/NotAETools.git
   cd NotAETools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   touch .env
   # Edit .env with your configuration
   ```

4. Start the application:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run prod
   ```

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Zlushiie](https://github.com/Zlushiie)
- Built for a Warframe community
- Special thanks to all contributors (me and me and testers)

## Support

For support, please:
1. Check the [documentation](https://github.com/UnKnownnPasta/NotAETools/tree/V2#readme)
2. Open an [issue](https://github.com/UnKnownnPasta/NotAETools/issues)
3. Contact the maintainers (me)

## Status

The project is actively maintained and deployed at [aetools.koyeb.app](https://aetools.koyeb.app).