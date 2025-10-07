# GDE Backend API Documentation

## 🚀 Architecture Overview

The GDE backend is a **FastAPI-only API** that provides:

- **Complete REST API** with FastAPI
- **Easy web integration** from any frontend
- **JWT Authentication** for security
- **Docker ready** for deployment in any environment
- **Horizontal and vertical scalability**
- **Automatic documentation** with OpenAPI/Swagger

## 📁 Project Structure

```
GDE_BACKEND/
├── api/                          # FastAPI REST API
│   ├── main.py                   # FastAPI application
│   ├── routers/                  # API endpoints
│   │   ├── auth.py               # Authentication
│   │   ├── users.py              # User management
│   │   ├── inventory.py          # Inventory operations
│   │   ├── accounting.py         # Accounting
│   │   ├── kardex.py             # Kardex reports
│   │   ├── delivery_guides.py    # Delivery guides
│   │   └── reports.py            # Reports
│   ├── middleware/               # API middleware
│   └── schemas/                  # Pydantic models
│
├── database/                     # Database models and utilities
│   ├── models/                   # SQLAlchemy models
│   ├── repositories/             # Data access layer
│   └── migrations/               # Database migrations
│
├── services/                     # Business logic services
├── shared/                       # Shared utilities
├── config.py                     # Configuration
├── main.py                       # Main entry point
├── main_api.py                   # Direct API entry
└── requirements.txt              # Dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install API dependencies
pip install -r requirements.txt
```

### 2. Run the API

```bash
# Option 1: Run directly (default mode)
python main.py

# Option 2: Use direct API entry point
python main_api.py

# Option 3: With uvicorn directly
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Verify it works

```bash
# Health check
curl http://localhost:8000/health

# View documentation
open http://localhost:8000/docs
```

### 4. API Documentation

Once the API server is started, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json
- **Health Check**: http://localhost:8000/health

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Current user info
- `POST /api/v1/auth/change-password` - Change password

### Inventory
- `GET /api/v1/inventory/products` - List products
- `POST /api/v1/inventory/products` - Create product
- `GET /api/v1/inventory/products/{id}` - Get product
- `PUT /api/v1/inventory/products/{id}` - Update product
- `POST /api/v1/inventory/stock-movements` - Create movement
- `GET /api/v1/inventory/valuation` - Inventory valuation

### Accounting
- `GET /api/v1/accounting/transactions` - Transactions
- `POST /api/v1/accounting/transactions` - New transaction
- `GET /api/v1/accounting/balance-sheet` - Balance sheet
- `GET /api/v1/accounting/income-statement` - Income statement

### Reports
- `GET /api/v1/reports/inventory?format=pdf|excel|json` - Inventory report
- `GET /api/v1/reports/sales?format=pdf|excel|json` - Sales report
- `GET /api/v1/reports/financial` - Financial report

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Login at `/api/v1/auth/login` with username/password
2. Include token in header: `Authorization: Bearer <token>`
3. Token expires in 8 hours (24h with remember_me)

### Usage Example:

```python
import httpx

# Login
response = httpx.post("http://localhost:8000/api/v1/auth/login", json={
    "username": "admin",
    "password": "password"
})
token = response.json()["data"]["access_token"]

# Use token
headers = {"Authorization": f"Bearer {token}"}
products = httpx.get("http://localhost:8000/api/v1/inventory/products", headers=headers)
```

## 🤝 Web Integration

To integrate with a web page:

1. **SPA Frontend** (React, Vue, Angular):
   - Consume the REST API directly
   - Use JWT for authentication
   - CORS is configured

2. **Traditional Frontend**:
   - Serve static files from `/web/`
   - Use Jinja2 templates if needed
   - Reverse proxy with Nginx

3. **Mobile Apps**:
   - Consume the same REST API
   - JWT authentication compatible

## Environment Variables

Required environment variables:

- `DATABASE_URL` - Database connection string
- `JWT_SECRET_KEY` - JWT token secret
- `ALLOWED_ORIGINS` - CORS allowed origins
- `DEBUG` - Debug mode (true/false)

## Production Deployment

The backend can be deployed to:

- **Koyeb** - Recommended for API deployment
- **Railway** - Alternative cloud platform
- **Docker** - Any container platform
- **Traditional hosting** - VPS/dedicated server

---

**🎉 The system is ready for complete web integration with a robust and scalable REST API!**