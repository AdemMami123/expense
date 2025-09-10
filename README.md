# Expense Tracker PWA

A Progressive Web App for tracking personal expenses with offline functionality, built with React, Firebase, and TailwindCSS.

## Features

### Core Features
- ✅ Add, edit, and delete expenses
- ✅ Categorize expenses with predefined categories
- ✅ Offline-first functionality with IndexedDB
- ✅ Automatic sync with Firebase Firestore when online
- ✅ Real-time data synchronization across devices
- ✅ User authentication with Firebase Auth

### Analytics & Visualization
- ✅ Dashboard with spending statistics
- ✅ Interactive pie charts for category breakdown
- ✅ Bar charts for daily/weekly spending trends
- ✅ Monthly, weekly, and daily spending totals

### PWA Features
- ✅ Installable on mobile and desktop
- ✅ Offline functionality with service worker
- ✅ Background sync for data synchronization
- ✅ Responsive design for all screen sizes
- ✅ App-like experience with manifest.json

### Budget Management
- ✅ Create custom budgets with flexible time periods (daily, weekly, monthly, yearly)
- ✅ Category-specific or overall spending limits
- ✅ Customizable warning thresholds (e.g., alert at 80% of budget)
- ✅ Real-time budget progress tracking with visual indicators
- ✅ Smart budget alerts and notifications:
  - Warning alerts when approaching budget limit
  - Exceeded alerts when budget is surpassed
  - Approaching alerts for early warnings
- ✅ Budget status dashboard with color-coded progress bars
- ✅ Automatic budget checking after each expense entry
- ✅ Budget summary widget on main dashboard

### Advanced Features
- ✅ Dark mode toggle with system preference detection
- ✅ CSV export functionality (all data, date ranges, categories)
- ✅ Multi-device synchronization
- ✅ Offline indicator and sync status

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: TailwindCSS with dark mode support
- **Charts**: Chart.js with react-chartjs-2
- **Database**: Firebase Firestore (online) + IndexedDB (offline)
- **Authentication**: Firebase Auth
- **PWA**: Service Worker, Web App Manifest
- **Build Tool**: Vite
- **Deployment**: Firebase Hosting

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd expense-tracker-pwa
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Hosting
   - Get your Firebase config

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (for server-side operations)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key"
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Build and deploy to Firebase
- `npm run deploy:hosting` - Deploy only hosting
- `npm run deploy:firestore` - Deploy only Firestore rules
- `npm run serve` - Serve locally with Firebase

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── charts/         # Chart components
│   ├── common/         # Shared components
│   ├── dashboard/      # Dashboard components
│   ├── expenses/       # Expense-related components
│   └── pwa/           # PWA-specific components
├── contexts/           # React contexts
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── main.tsx          # Application entry point
```

## Features in Detail

### Offline Functionality
- Uses IndexedDB for local storage
- Automatic background sync when online
- Visual indicators for sync status
- Graceful handling of network failures

### Data Export
- Export all expenses to CSV
- Filter by date range or category
- Generate summary reports
- Automatic file download

### Budget Management
- Set monthly, weekly, or daily budgets
- Category-specific budget limits
- Automatic alerts at 80% and 100% thresholds
- Visual progress indicators

### PWA Features
- Install prompt for mobile/desktop
- Offline indicator
- Service worker for caching
- Background sync capabilities

## Security

- Firestore security rules ensure users can only access their own data
- Firebase Auth handles user authentication
- Environment variables for sensitive configuration
- HTTPS enforced in production

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Deployment

The app is configured for deployment on Firebase Hosting with the following features:
- Automatic HTTPS
- Global CDN
- Custom domain support
- Automatic builds from Git

To deploy:
```bash
npm run deploy
```

## Performance

- Lighthouse PWA score: 100/100
- Offline functionality
- Fast loading with service worker caching
- Optimized bundle size with code splitting
- Responsive images and assets

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.