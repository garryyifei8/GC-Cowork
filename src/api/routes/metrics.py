"""Prometheus-compatible metrics endpoint."""

from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter
from starlette.responses import Response

router = APIRouter(tags=["metrics"])

# Simple in-memory counters (production would use prometheus_client library)
_request_count: dict[str, int] = defaultdict(int)
_request_duration: dict[str, list[float]] = defaultdict(list)
_error_count: dict[str, int] = defaultdict(int)


def record_request(method: str, path: str, status: int, duration: float) -> None:
    """Record a request for metrics."""
    key = f"{method}_{path}_{status}"
    _request_count[key] += 1
    _request_duration[key].append(duration)
    if status >= 400:
        _error_count[f"{method}_{path}"] += 1


def _percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    sorted_v = sorted(values)
    idx = int(len(sorted_v) * p / 100)
    return sorted_v[min(idx, len(sorted_v) - 1)]


@router.get("/metrics")
async def get_metrics() -> Response:
    """Return Prometheus text format metrics."""
    lines = [
        "# HELP http_requests_total Total HTTP requests",
        "# TYPE http_requests_total counter",
    ]
    for key, count in sorted(_request_count.items()):
        parts = key.rsplit("_", 1)
        if len(parts) == 2:
            lines.append(f'http_requests_total{{endpoint="{parts[0]}",status="{parts[1]}"}} {count}')

    lines.append("# HELP http_request_duration_seconds HTTP request duration")
    lines.append("# TYPE http_request_duration_seconds summary")
    for key, durations in sorted(_request_duration.items()):
        parts = key.rsplit("_", 1)
        if len(parts) == 2:
            ep = parts[0]
            p50 = _percentile(durations, 50)
            p95 = _percentile(durations, 95)
            lines.append(f'http_request_duration_seconds{{endpoint="{ep}",quantile="0.5"}} {p50:.4f}')
            lines.append(f'http_request_duration_seconds{{endpoint="{ep}",quantile="0.95"}} {p95:.4f}')

    lines.append("# HELP http_errors_total Total HTTP errors (4xx+5xx)")
    lines.append("# TYPE http_errors_total counter")
    for key, count in sorted(_error_count.items()):
        lines.append(f'http_errors_total{{endpoint="{key}"}} {count}')

    return Response(content="\n".join(lines) + "\n", media_type="text/plain; charset=utf-8")
