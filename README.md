# Express Entry Tracker

A Progressive Web App for tracking IRCC Express Entry draws built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Live Demo

- **Live Site**: [https://kashif-khan.github.io/express_entry_tracker/](https://kashif-khan.github.io/express_entry_tracker/)
- **Local Development**: [http://localhost:3000/](http://localhost:3000/)

## 📋 Features

- Real-time Express Entry draw data from IRCC
- Animated statistics with anime.js
- Interactive data table with filtering, sorting, and paging
- Resizable and draggable columns
- Offline-first with IndexedDB storage
- Progressive Web App features
- Fully accessible (WCAG compliant)

## 🛠️ Development

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/kashif-khan/express_entry_tracker.git
cd express_entry_tracker

# Install dependencies
npm ci

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000/](http://localhost:3000/) (or the next available port).

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types
- `npm run test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run cypress:open` - Open Cypress for e2e testing
- `npm run cypress:run` - Run Cypress tests headlessly

## 🚀 Deployment

### GitHub Pages (Automatic)

The app automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

**Live URL**: [https://kashif-khan.github.io/express_entry_tracker/](https://kashif-khan.github.io/express_entry_tracker/)

### Manual Deployment

```bash
# Build and deploy to gh-pages branch
npm run deploy:gh
```

### Local Production Build

```bash
# Build for local production testing
npm run build

# The built files will be in the 'out' directory
# You can serve them with any static file server
```

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: anime.js
- **Storage**: IndexedDB (via idb library)
- **Testing**: Jest + Testing Library + Cypress
- **Deployment**: GitHub Pages (static export)

### Configuration

The app uses environment-aware configuration:

- **Local Development**: Runs on `localhost:3000` without any path prefix
- **GitHub Pages**: Runs on `kashif-khan.github.io/express_entry_tracker/` with proper base path

This is automatically handled by the Next.js configuration based on the `GITHUB_PAGES` environment variable.

### Feature Flags

The app supports feature flags for toggling functionality:

- `NEXT_PUBLIC_FEATURE_TABLE_DRAG` - Enable/disable table column dragging
- `NEXT_PUBLIC_FEATURE_TABLE_RESIZE` - Enable/disable column resizing
- `NEXT_PUBLIC_FEATURE_STATS_ANIMATIONS` - Enable/disable stat animations
- `NEXT_PUBLIC_FEATURE_A11Y_CHECKS` - Enable/disable accessibility checks

## 📊 Data Source

Data is fetched from the official IRCC Express Entry JSON endpoint:
`https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json`

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
# Interactive mode
npm run cypress:open

# Headless mode
npm run cypress:run
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or issues, please open an issue on GitHub.