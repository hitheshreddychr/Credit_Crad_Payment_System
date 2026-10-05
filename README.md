# Credit Card Payment System - Assessment 21

## Overview
A secure Credit Card Payment System built using React, Django, FastAPI, MySQL and Docker.

## Technologies
- React + Tailwind CSS
- Django REST Framework
- FastAPI
- MySQL
- JWT Authentication
- Docker and Docker Compose

## Features
- User registration and JWT login
- Secure password encryption
- Add, view and delete cards
- Card number masking
- Simulated payment processing
- SUCCESS / FAILED payment status
- Transaction history and filters
- Admin dashboard
- CSV transaction export
- Daily payment summary
- FastAPI Swagger documentation

## API Documentation
FastAPI Swagger: http://localhost:8001/docs

## Docker
Run: docker compose up -d --build

Frontend: http://localhost:5173
Django: http://localhost:8000
Django Admin: http://localhost:8000/admin/

## Testing
pytest -q
pytest --cov=. --cov-report=term-missing

Test coverage: 72%

## Database
MySQL is used for users, cards, transactions and admin logs.
Database dump: submission/credit_card_payment_system.sql

## Security
- JWT authentication
- Encrypted passwords
- Card number masking
- CVV is not stored
- Environment variables for secrets
- Protected API routes
