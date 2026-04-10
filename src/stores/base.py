"""Abstract base store interface — Adapter pattern.

Concrete implementations:
  - Memory stores (existing): src/stores/*_store.py
  - Supabase stores (new):    src/stores/supabase/*_store.py

The API routes don't need to know which backend is active.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseStore(ABC):
    """Abstract CRUD interface that all stores must implement."""

    @abstractmethod
    async def list(self, **filters: Any) -> list[dict]:
        """List records with optional filters."""
        ...

    @abstractmethod
    async def get(self, record_id: str) -> dict | None:
        """Get a single record by ID."""
        ...

    @abstractmethod
    async def create(self, data: dict) -> dict:
        """Create a new record and return it."""
        ...

    @abstractmethod
    async def update(self, record_id: str, data: dict) -> dict | None:
        """Partially update a record. Returns None if not found."""
        ...

    async def delete(self, record_id: str) -> bool:
        """Delete a record. Returns True if deleted."""
        raise NotImplementedError("Delete not supported by this store")

    async def count(self, **filters: Any) -> int:
        """Count records matching filters."""
        return len(await self.list(**filters))
