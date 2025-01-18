# Bike to Subway Navigator

## Overview

Bike to Subway Navigator is a web application designed to optimize urban commutes by combining bike-sharing services with subway transportation. This tool calculates time-saving routes by replacing walking segments with Citi Bike rides, providing users with efficient navigation from their current location to their desired destination.

## Current Status

The project is in active development with several core features implemented:

- Web application built using ReactJS and TailwindCSS
- Supabase backend integration
- Google Maps API integration for routing and navigation
- User interface for location input and route display

### Implemented Features

- [x] Google Maps integration
- [x] User location detection
- [x] Destination search functionality
- [x] Basic route calculation

### In Progress

- [ ] Enhanced routing tab
- [ ] Directions display on map
- [ ] Citi Bike station integration
- [ ] Time-saving calculations

## Technical Stack

- Frontend: ReactJS, TypeScript
- Styling: TailwindCSS, shadcn-ui
- Backend: Supabase
- Build Tool: Vite
- Maps and Routing: Google Maps APIs
- Bike-sharing Data: Citi Bike APIs
- Code Assistance: Lovable, Bolt, Copilot, Perplexity

## Key Features

1. **Real-time Bike Availability**: Utilizes Citi Bike APIs to fetch live data on bike availability at nearby stations.
2. **Intelligent Routing**: Combines walking, biking, and subway options to create optimal routes.
3. **Time-saving Calculations**: Estimates time saved by replacing walking segments with Citi Bike rides.
4. **Interactive Map Interface**: Displays routes and bike stations on an interactive Google Map.

## Setup and Development

### Requirements

- Node.js (v14+)
- Google Maps API key with access to:
  - Directions API
  - Places API
  - Maps JavaScript API
- Citi Bike API access

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd bike-to-subway-navigator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the development server
npm run dev
```

### Development Options

1. **Use Lovable**: Visit the [Lovable Project](https://lovable.dev/projects/6272fc80-3bdb-4f56-a362-5bd6c648e657) to start prompting. Changes made via Lovable are automatically committed to the repo.

2. **Use your preferred IDE**: Clone the repo and push changes. Pushed changes will be reflected in Lovable.

3. **Edit directly in GitHub**: Navigate to files, click "Edit", make changes, and commit.

4. **Use GitHub Codespaces**: Launch a new Codespace environment from the repository's main page.

## Deployment

For quick deployment, open [Lovable](https://lovable.dev/projects/6272fc80-3bdb-4f56-a362-5bd6c648e657) and click on Share -> Publish.

TBD on custom domain.

## Next Steps

1. Implement the enhanced routing tab
2. Integrate Citi Bike station data into the routing algorithm
3. Develop time-saving calculation logic
4. Improve map visualization of routes and bike stations
5. Implement user authentication and route saving features


## License

[MIT License] see /transit-spoke-navigator/LICENSE.TXT

## Contact

walsh kang
wkang1281@gmail.com