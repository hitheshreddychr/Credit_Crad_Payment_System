
# Credit Card Payment System

## Overview

A containerized credit card payment system built using React, Django REST Framework, FastAPI, MySQL, and Docker.

## Technologies

- React and Tailwind CSS
- Django REST Framework
- FastAPI payment service
- MySQL
- JWT authentication
- Docker and Docker Compose
- Python and PowerShell

## Features

### Authentication and Cards
- User registration and JWT login
- Password hashing through Django authentication
- Card management and masked card numbers
- Credit and debit card categories
- Credit-limit management and card blocking

### Transactions and Fraud Detection
- Simulated payment processing
- Transaction history, filtering, and exports
- High-value transaction detection
- Rapid transaction activity detection using IP and device information
- Fraud status and reason tracking
- Transaction-related email notifications

### Role-Based Access Control
- Admin, Support, and Read-Only roles
- Protected administrative endpoints
- Restrictions on sensitive administrative actions
- Audit logs for administrative operations

### Analytics and Monitoring
- Monthly spending summaries
- Category-based spending analysis
- Credit utilization reporting
- Transaction filtering and pagination
- CSV and PDF analytics exports
- System health endpoint
- API request IDs, response-time headers, and request logging

## Services

| Service | Local URL |
|---|---|
| React frontend | http://localhost:5173 |
| Django API | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin/ |
| FastAPI Swagger | http://localhost:8001/docs |

## Assessment 24 API Endpoints

- `GET /api/payments/admin/analytics/`
- `GET /api/payments/admin/analytics/export/csv/`
- `GET /api/payments/admin/analytics/export/pdf/`
- `GET /api/payments/admin/system-health/`
- `GET /api/payments/admin/transactions/`
- `GET /api/admin/users/`
- `GET /api/admin/cards/`

Administrative endpoints require authentication and the appropriate role.

## Running with Docker

Start the services:

```bash
docker compose up -d --build
```

View service status:

```bash
docker compose ps
```

View backend logs:

```bash
docker compose logs --tail=100 backend
```

## Testing

Run the backend test suite:

```bash
docker compose exec backend python manage.py test
```

Run the RBAC tests:

```bash
docker compose exec backend python manage.py test users.test_assessment24_rbac -v 2
```

Run the fraud detection tests:

```bash
docker compose exec backend python manage.py test transactions.test_assessment24_fraud -v 2
```

Check Django configuration and migration consistency:

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations --check --dry-run
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Database and Security

- MySQL stores application data.
- Database configuration and credentials should be supplied through environment variables.
- `.env` files must not be committed to Git.
- JWT authentication protects API access.
- Administrative permissions restrict sensitive operations.
- Card numbers are masked in administrative responses.
- Fraud events and administrative actions are recorded.
- Do not commit credentials, access tokens, private keys, or personal transaction exports.

## Development Notes

The included Django development server is intended for local development. Use an appropriately configured production server and production security settings before deploying publicly.
