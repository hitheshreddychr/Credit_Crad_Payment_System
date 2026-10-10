
import logging
import time
import uuid

from django.utils.deprecation import MiddlewareMixin


logger = logging.getLogger("api_monitoring")


class APIMonitoringMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.api_monitoring_start = time.perf_counter()
        request.api_monitoring_id = str(uuid.uuid4())

    def process_response(self, request, response):
        start_time = getattr(request, "api_monitoring_start", None)

        if start_time is None:
            return response

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        request_id = getattr(request, "api_monitoring_id", "unknown")
        path = request.path
        method = request.method
        status_code = response.status_code

        if path.startswith("/api/"):
            log_data = {
                "request_id": request_id,
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
            }

            if status_code >= 500:
                logger.error("API request failed: %s", log_data)
            elif status_code >= 400:
                logger.warning("API request returned client error: %s", log_data)
            else:
                logger.info("API request completed: %s", log_data)

            response["X-Request-ID"] = request_id
            response["X-Response-Time-ms"] = str(duration_ms)

        return response
