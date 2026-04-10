"""Supabase Storage service — file upload, download, delete via REST API.

Uses httpx directly against the Supabase Storage REST API, consistent
with the PostgREST client pattern in src/db/client.py.

Usage:
    from src.services.storage import get_storage

    storage = get_storage()
    path = storage.upload("documents", content, "report.pdf", "application/pdf")
    data = storage.download("documents", path)
    storage.delete("documents", path)
"""

from __future__ import annotations

import os
from functools import lru_cache

import httpx

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MiB

BUCKET_MIME_MAP: dict[str, list[str]] = {
    "documents": [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "application/zip",
        "application/x-rar-compressed",
    ],
    "media": [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/webm",
    ],
}


def resolve_bucket(mime_type: str | None) -> str:
    """Pick the right bucket based on MIME type. Falls back to 'attachments'."""
    if not mime_type:
        return "attachments"
    for bucket, types in BUCKET_MIME_MAP.items():
        if mime_type in types:
            return bucket
    return "attachments"


def validate_file(content: bytes, mime_type: str | None, file_name: str | None) -> None:
    """Raise ValueError if the file violates size/type constraints."""
    if len(content) > MAX_FILE_SIZE:
        size_mb = len(content) / (1024 * 1024)
        raise ValueError(f"文件大小 {size_mb:.1f}MB 超过限制 ({MAX_FILE_SIZE // (1024 * 1024)}MB)")
    if not file_name:
        raise ValueError("文件名不能为空")


# ---------------------------------------------------------------------------
# StorageService
# ---------------------------------------------------------------------------


class StorageService:
    """Thin wrapper around Supabase Storage REST API."""

    def __init__(self, base_url: str, api_key: str):
        self.storage_url = f"{base_url.rstrip('/')}/storage/v1"
        self.api_key = api_key

    def _headers(self, content_type: str = "application/json") -> dict[str, str]:
        return {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": content_type,
        }

    def upload(
        self,
        bucket: str,
        content: bytes,
        path: str,
        mime_type: str = "application/octet-stream",
    ) -> str:
        """Upload a file and return the storage path.

        Args:
            bucket: Target bucket name.
            content: Raw file bytes.
            path: Object path within the bucket (e.g. "proj-001/report.pdf").
            mime_type: MIME type for the Content-Type header.

        Returns:
            The storage path "{bucket}/{path}".
        """
        url = f"{self.storage_url}/object/{bucket}/{path}"
        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": mime_type,
            "x-upsert": "true",
        }
        with httpx.Client(timeout=60) as http:
            resp = http.post(url, content=content, headers=headers)
        if resp.status_code >= 400:
            raise RuntimeError(f"Storage upload error {resp.status_code}: {resp.text}")
        return f"{bucket}/{path}"

    def download(self, bucket: str, path: str) -> bytes:
        """Download a file and return its bytes."""
        url = f"{self.storage_url}/object/{bucket}/{path}"
        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
        }
        with httpx.Client(timeout=60) as http:
            resp = http.get(url, headers=headers)
        if resp.status_code >= 400:
            raise RuntimeError(f"Storage download error {resp.status_code}: {resp.text}")
        return resp.content

    def delete(self, bucket: str, paths: list[str]) -> None:
        """Delete one or more objects from a bucket."""
        url = f"{self.storage_url}/object/{bucket}"
        headers = self._headers()
        with httpx.Client(timeout=30) as http:
            resp = http.request("DELETE", url, json={"prefixes": paths}, headers=headers)
        if resp.status_code >= 400:
            raise RuntimeError(f"Storage delete error {resp.status_code}: {resp.text}")

    def list_objects(self, bucket: str, prefix: str = "") -> list[dict]:
        """List objects in a bucket with optional prefix filter."""
        url = f"{self.storage_url}/object/list/{bucket}"
        headers = self._headers()
        body = {"prefix": prefix, "limit": 1000}
        with httpx.Client(timeout=30) as http:
            resp = http.post(url, json=body, headers=headers)
        if resp.status_code >= 400:
            raise RuntimeError(f"Storage list error {resp.status_code}: {resp.text}")
        return resp.json()

    def get_public_url(self, bucket: str, path: str) -> str:
        """Return the public URL for an object (only works for public buckets)."""
        return f"{self.storage_url}/object/public/{bucket}/{path}"


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def get_storage() -> StorageService:
    """Return a cached StorageService instance."""
    url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
    key = os.environ.get(
        "SUPABASE_SERVICE_ROLE_KEY",
        os.environ.get("SUPABASE_ANON_KEY", ""),
    )
    if not key:
        raise RuntimeError("SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY required.")
    return StorageService(url, key)
