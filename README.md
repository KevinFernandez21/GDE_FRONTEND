# GDE Frontend - Sistema de Gestión de Inventario y Contabilidad

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

## 🌐 Overview

Modern web frontend for the GDE inventory and accounting management system. Built with Next.js 14, TypeScript, and Tailwind CSS for a responsive and efficient user experience.

## 🚀 Features

- **Modern UI/UX** - Clean and responsive interface
- **Real-time Updates** - Live data synchronization
- **Inventory Management** - Complete product and stock control
- **Accounting Module** - Financial transactions and reporting
- **User Authentication** - Secure JWT-based login system
- **Export Functionality** - PDF and Excel report generation
- **Mobile Responsive** - Works on all device sizes

## 🏗️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: React Context + Custom hooks
- **HTTP Client**: Fetch API with custom service layer
- **Authentication**: JWT tokens with secure storage
- **Deployment**: Vercel

## 📁 Project Structure

```
GDE-FRONTEND/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── dashboard/                # Main dashboard
│   ├── inventory/                # Inventory management
│   ├── accounting/               # Accounting module
│   ├── reports/                  # Reports and analytics
│   └── api/                      # API route handlers
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   ├── forms/                    # Form components
│   ├── tables/                   # Data table components
│   └── charts/                   # Chart components
├── contexts/                     # React contexts
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities and configurations
│   ├── api.ts                    # API service layer
│   ├── auth.ts                   # Authentication utilities
│   └── utils.ts                  # General utilities
├── public/                       # Static assets
└── styles/                       # Global styles
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Using npm
npm install

# Using pnpm (recommended)
pnpm install
```

### 2. Environment Setup

Copy the environment example file:

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="GDE - Sistema de Gestión"
```

### 3. Run Development Server

```bash
# Using npm
npm run dev

# Using pnpm
pnpm dev
```

### 4. Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔌 Backend Integration

This frontend connects to the GDE FastAPI backend. See [BACKEND_API_DOCS.md](./BACKEND_API_DOCS.md) for complete API documentation.

### API Endpoints Used

- `/api/v1/auth/*` - Authentication
- `/api/v1/inventory/*` - Inventory management
- `/api/v1/accounting/*` - Financial operations
- `/api/v1/reports/*` - Report generation

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_APP_NAME="GDE - Sistema de Gestión"
```

## 📱 Features by Module

### Authentication
- Secure login with JWT tokens
- Password reset functionality
- User session management
- Role-based access control

### Inventory Management
- Product catalog management
- Stock movement tracking
- Real-time inventory valuation
- Barcode scanning support
- Low stock alerts

### Accounting
- Transaction recording
- Chart of accounts management
- Balance sheet generation
- Income statement reports
- Tax calculation support

### Reports & Analytics
- Interactive dashboards
- Export to PDF/Excel
- Custom date range filtering
- Visual charts and graphs
- Automated report scheduling

## 🛠️ Development

### Code Style

- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting
- Tailwind CSS for styling

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📖 Documentation

- [Backend API Documentation](./BACKEND_API_DOCS.md)
- [Component Documentation](./docs/components.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**🎉 Ready for modern web inventory and accounting management!**