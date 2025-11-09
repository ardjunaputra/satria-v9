# SATRIA Intelligence System - Frontend

Real-time intelligence aggregation and analysis platform for the Malaysian Army Intelligence Service.

## Features

- **Real-time Dashboard** - Live intelligence feed with WebSocket updates
- **Advanced Filtering** - Filter by category, priority, region, and keywords
- **24-Hour Window** - All displayed articles are from the last 24 hours only
- **Saved Searches** - Save and quickly access frequent filter combinations
- **Alert System** - Configure custom alerts for critical intelligence
- **Multi-Factor Authentication** - TOTP-based 2FA for enhanced security
- **Role-Based Access Control** - 4 user roles with granular permissions
- **Article Management** - Read tracking, flagging, and export capabilities
- **Admin Panel** - System monitoring and user management

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Socket.io** - Real-time WebSocket communication
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Hot Toast** - Notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleDetail.tsx
│   │   ├── ArticleGrid.tsx
│   │   ├── FilterBar.tsx
│   │   └── Layout.tsx
│   ├── pages/              # Page components
│   │   ├── Login.tsx
│   │   ├── MFAVerify.tsx
│   │   ├── Dashboard.tsx
│   │   ├── SavedSearches.tsx
│   │   ├── Alerts.tsx
│   │   ├── Settings.tsx
│   │   └── AdminPanel.tsx
│   ├── stores/             # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── filterStore.ts
│   │   └── notificationStore.ts
│   ├── lib/                # Utilities and services
│   │   ├── api.ts          # API client functions
│   │   ├── axios.ts        # Axios configuration
│   │   ├── socket.ts       # WebSocket service
│   │   └── utils.ts        # Helper functions
│   ├── hooks/              # Custom React hooks
│   │   └── useWebSocket.ts
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Key Features Explained

### 24-Hour Time Window

The system enforces a strict 24-hour time window for all displayed articles:
- Backend filters articles at the database query level
- Frontend validation ensures time_range never exceeds 24 hours
- Warning banner displays prominently on the Dashboard
- Older articles are automatically excluded from search results

### Real-Time Updates

WebSocket integration provides live updates:
- New articles appear automatically without refresh
- Alert notifications trigger instantly
- Aggregation status updates in real-time
- Sound notifications for critical/high priority articles

### Authentication Flow

1. **Login** - Email/password authentication
2. **MFA Verification** - TOTP 6-digit code (if enabled)
3. **Session Management** - JWT token stored securely
4. **Auto-logout** - On token expiration or invalid response

### Role-Based Access Control

- **Admin** - Full system access including user management
- **Senior Analyst** - Export data, manage keywords and searches
- **Analyst** - View, filter, flag articles, create alerts
- **Viewer** - Read-only access to articles

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |
| `VITE_ENV` | Environment name | `development` |

## Default Credentials

For testing purposes (change immediately in production):
- **Email**: admin@satria.army.mil.my
- **Password**: Admin@123456

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Security Considerations

- All API requests include JWT authentication
- WebSocket connections are authenticated
- Sensitive data never stored in localStorage
- XSS protection via React's built-in sanitization
- CSRF protection via cookie-based auth

## Performance Optimizations

- Code splitting per route
- Lazy loading of heavy components
- React Query caching and background refetching
- Debounced search inputs
- Virtual scrolling for large lists (if needed)
- Image lazy loading

## Troubleshooting

### WebSocket not connecting
- Verify backend is running
- Check VITE_SOCKET_URL is correct
- Ensure no CORS issues

### Articles not loading
- Verify API endpoint is accessible
- Check authentication token is valid
- Review browser console for errors

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## Contributing

This is a military intelligence system. All contributions must be authorized and reviewed by the Malaysian Army Intelligence Service.

## License

Proprietary - Malaysian Army Intelligence Service

## Support

For technical support, contact the SATRIA development team.
