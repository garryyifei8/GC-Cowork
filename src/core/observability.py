"""Sentry error tracking initialization."""

from __future__ import annotations

import os


def setup_sentry() -> None:
    """Initialize Sentry if SENTRY_DSN is configured."""
    dsn = os.environ.get("SENTRY_DSN", "")
    if not dsn:
        return

    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    sentry_sdk.init(
        dsn=dsn,
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_RATE", "0.1")),
        profiles_sample_rate=float(os.environ.get("SENTRY_PROFILES_RATE", "0.1")),
        environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
        ],
        send_default_pii=False,
    )
