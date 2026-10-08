from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .dashboard import router as dashboard_router
from .schemas import PaymentRequest, PaymentResponse

app = FastAPI(
    title="Credit Card Payment Service",
    description="FastAPI payment processing service for Assessment 21 and 22.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Credit Card Payment Service is running."
    }


@app.get("/health/")
def health_check():
    return {
        "status": "healthy"
    }


@app.post(
    "/payments/process/",
    response_model=PaymentResponse,
)
def process_payment(payment: PaymentRequest):
    transaction_id = (
        f"TXN-{uuid4().hex[:12].upper()}"
    )

    status = "PENDING"

    if payment.amount > 0:
        status = "SUCCESS"
        message = "Payment processed successfully."
    else:
        status = "FAILED"
        message = "Payment failed."

    return PaymentResponse(
        transaction_id=transaction_id,
        status=status,
        amount=payment.amount,
        currency=payment.currency.upper(),
        message=message,
    )


app.include_router(
    dashboard_router
)