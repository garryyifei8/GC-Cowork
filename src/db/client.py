"""Supabase database client — lightweight PostgREST wrapper.

Bypasses supabase-py SDK (which has key format issues with CLI v2.75+)
and uses httpx directly against the PostgREST API.

Usage:
    from src.db.client import SupabaseClient, get_client

    db = get_client()
    projects = db.from_("projects").select("*").execute()
    db.from_("projects").insert({"id": "proj-new", "name": "Test"}).execute()
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

import httpx


class EnumStr(str):
    """String subclass that has a .value property, mimicking Python Enum behavior.

    API routes do `project.stage.value` expecting an Enum, but Supabase returns plain strings.
    """

    @property
    def value(self):
        return str(self)

    # Make Pydantic see this as a plain str for Literal validation
    @classmethod
    def __get_pydantic_core_schema__(cls, _source, _handler):
        from pydantic_core import core_schema

        return core_schema.str_schema()


class DotDict(dict):
    """Dict that supports attribute access (obj.key) for Pydantic model compatibility.

    API routes expect `project.id` not `project["id"]`, so we wrap Supabase results.
    String values are wrapped in EnumStr so `.value` works on enum-like fields.
    Also supports model_copy(update=...) and model_dump() for compatibility.
    """

    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            raise AttributeError(f"'DotDict' has no attribute '{key}'")

    def __setattr__(self, key, value):
        self[key] = value

    def model_copy(self, update: dict = None):
        new = DotDict(self)
        if update:
            new.update(update)
        return new

    def model_dump(self):
        """Return a plain dict with plain str values (unwrap EnumStr for Pydantic)."""
        return _clean_for_pydantic(self)

    def to_dict(self):
        """Alias for model_dump."""
        return _clean_for_pydantic(self)

    def __iter__(self):
        """Override iter to return plain string keys for Pydantic dict unpacking."""
        return dict.__iter__(self)


def _clean_for_pydantic(d: dict) -> dict:
    """Convert DotDict values to plain Python types for Pydantic response_model validation."""
    result = {}
    for k, v in d.items():
        if isinstance(v, EnumStr):
            result[k] = str.__str__(v)  # plain str
        elif isinstance(v, dict):
            result[k] = _clean_for_pydantic(v)
        elif isinstance(v, list):
            result[k] = [
                _clean_for_pydantic(i) if isinstance(i, dict) else (str.__str__(i) if isinstance(i, EnumStr) else i)
                for i in v
            ]
        else:
            result[k] = v
    return result


class DotDictJSONMixin:
    """Mixin to make DotDict work with FastAPI's response_model serialization."""

    def __json__(self):
        return _clean_for_pydantic(self)


class QueryResult:
    """Wrapper for PostgREST response."""

    def __init__(self, data: list[dict], count: int | None = None):
        self.data = [DotDict(d) for d in data]
        self.count = count


class QueryBuilder:
    """Fluent query builder for PostgREST."""

    def __init__(self, client: SupabaseClient, table: str):
        self._client = client
        self._table = table
        self._method = "GET"
        self._body: Any = None
        self._params: dict[str, str] = {}
        self._headers: dict[str, str] = {}
        self._filters: list[str] = []

    def select(self, columns: str = "*", *, count: str | None = None) -> QueryBuilder:
        self._method = "GET"
        self._params["select"] = columns
        if count:
            self._headers["Prefer"] = f"count={count}"
        return self

    def insert(self, data: dict | list[dict]) -> QueryBuilder:
        self._method = "POST"
        self._body = data if isinstance(data, list) else [data]
        self._headers["Prefer"] = "return=representation"
        return self

    def update(self, data: dict) -> QueryBuilder:
        self._method = "PATCH"
        self._body = data
        self._headers["Prefer"] = "return=representation"
        return self

    def delete(self) -> QueryBuilder:
        self._method = "DELETE"
        self._headers["Prefer"] = "return=representation"
        return self

    def eq(self, column: str, value: Any) -> QueryBuilder:
        self._params[column] = f"eq.{value}"
        return self

    def neq(self, column: str, value: Any) -> QueryBuilder:
        self._params[column] = f"neq.{value}"
        return self

    def in_(self, column: str, values: list) -> QueryBuilder:
        self._params[column] = f"in.({','.join(str(v) for v in values)})"
        return self

    def is_(self, column: str, value: Any) -> QueryBuilder:
        self._params[column] = f"is.{value}"
        return self

    def gte(self, column: str, value: Any) -> QueryBuilder:
        self._params[column] = f"gte.{value}"
        return self

    def lte(self, column: str, value: Any) -> QueryBuilder:
        self._params[column] = f"lte.{value}"
        return self

    def like(self, column: str, pattern: str) -> QueryBuilder:
        self._params[column] = f"like.{pattern}"
        return self

    def ilike(self, column: str, pattern: str) -> QueryBuilder:
        self._params[column] = f"ilike.{pattern}"
        return self

    def order(self, column: str, *, desc: bool = False) -> QueryBuilder:
        direction = "desc" if desc else "asc"
        self._params["order"] = f"{column}.{direction}"
        return self

    def limit(self, count: int) -> QueryBuilder:
        self._params["limit"] = str(count)
        return self

    def offset(self, start: int) -> QueryBuilder:
        self._params["offset"] = str(start)
        return self

    def maybe_single(self) -> QueryBuilder:
        """Accept 0 or 1 results (GET only)."""
        self._headers["Accept"] = "application/vnd.pgrst.object+json"
        return self

    def execute(self) -> QueryResult:
        """Execute the query and return results."""
        url = f"{self._client.rest_url}/{self._table}"
        headers = {
            "apikey": self._client.api_key,
            "Authorization": f"Bearer {self._client.api_key}",
            "Content-Type": "application/json",
            **self._headers,
        }

        with httpx.Client(timeout=30) as http:
            if self._method == "GET":
                resp = http.get(url, params=self._params, headers=headers)
            elif self._method == "POST":
                resp = http.post(url, json=self._body, params=self._params, headers=headers)
            elif self._method == "PATCH":
                resp = http.patch(url, json=self._body, params=self._params, headers=headers)
            elif self._method == "DELETE":
                resp = http.delete(url, params=self._params, headers=headers)
            else:
                raise ValueError(f"Unknown method: {self._method}")

        if resp.status_code >= 400:
            raise RuntimeError(f"PostgREST error {resp.status_code}: {resp.text}")

        # Parse response
        data = resp.json() if resp.text else []
        if isinstance(data, dict):
            data = [data]

        # Parse count from Content-Range header
        count = None
        content_range = resp.headers.get("content-range", "")
        if "/" in content_range:
            total = content_range.split("/")[-1]
            if total != "*":
                count = int(total)

        return QueryResult(data=data, count=count)


class SupabaseClient:
    """Lightweight Supabase/PostgREST client."""

    def __init__(self, url: str, api_key: str):
        self.base_url = url.rstrip("/")
        self.rest_url = f"{self.base_url}/rest/v1"
        self.api_key = api_key

    def from_(self, table: str) -> QueryBuilder:
        """Start a query on a table."""
        return QueryBuilder(self, table)

    # Alias for compatibility
    table = from_


@lru_cache(maxsize=1)
def get_client() -> SupabaseClient:
    """Return a cached SupabaseClient instance."""
    url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
    key = os.environ.get(
        "SUPABASE_SERVICE_ROLE_KEY",
        os.environ.get("SUPABASE_ANON_KEY", ""),
    )
    if not key:
        raise RuntimeError("SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY required.")
    return SupabaseClient(url, key)


# Legacy alias
get_supabase = get_client


def get_db_url() -> str:
    """Return the direct PostgreSQL connection URL."""
    return os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    )


def use_supabase() -> bool:
    """Check if Supabase is enabled via environment variable."""
    return os.environ.get("USE_SUPABASE", "false").lower() in ("true", "1", "yes")
