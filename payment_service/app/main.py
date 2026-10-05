from uuid import uuid4

from fastapi import FastAPI

from .schemas import PaymentRequest, PaymentResponse


app = FastAPI(
    title="Credit Card Payment Service",
    description="FastAPI payment processing service for Assessment 21.",
    version="1.0.0",
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
    transaction_id = f"TXN-{uuid4().hex[:12].upper()}"

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