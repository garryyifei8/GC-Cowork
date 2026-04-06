"""WebSocket notification endpoint for real-time push."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["websocket"])


# ---------------------------------------------------------------------------
# Connection Manager
# ---------------------------------------------------------------------------


class ConnectionManager:
    """Manages WebSocket connections and broadcasts."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self._user_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str = "anonymous"):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id not in self._user_connections:
            self._user_connections[user_id] = []
        self._user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str = "anonymous"):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        user_conns = self._user_connections.get(user_id, [])
        if websocket in user_conns:
            user_conns.remove(websocket)

    async def send_personal(self, user_id: str, message: dict[str, Any]):
        """Send notification to a specific user."""
        for conn in self._user_connections.get(user_id, []):
            try:
                await conn.send_json(message)
            except Exception:
                pass

    async def broadcast(self, message: dict[str, Any]):
        """Broadcast notification to all connected clients."""
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                disconnected.append(conn)
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Global manager instance
manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Helper to send notifications from anywhere in the app
# ---------------------------------------------------------------------------


async def notify_all(
    event_type: str,
    title: str,
    content: str = "",
    severity: str = "info",
    data: dict[str, Any] | None = None,
):
    """Send a notification to all connected users."""
    message = {
        "type": "notification",
        "event": event_type,
        "title": title,
        "content": content,
        "severity": severity,
        "data": data or {},
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(message)


async def notify_user(
    user_id: str,
    event_type: str,
    title: str,
    content: str = "",
    severity: str = "info",
    data: dict[str, Any] | None = None,
):
    """Send a notification to a specific user."""
    message = {
        "type": "notification",
        "event": event_type,
        "title": title,
        "content": content,
        "severity": severity,
        "data": data or {},
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.send_personal(user_id, message)


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    """WebSocket endpoint for real-time notifications.

    Clients connect and receive push notifications. They can also send
    messages to acknowledge/mark-read.
    """
    # Extract user_id from query params (or use anonymous)
    user_id = websocket.query_params.get("user_id", "anonymous")

    await manager.connect(websocket, user_id)
    try:
        # Send welcome message
        await websocket.send_json(
            {
                "type": "connected",
                "message": "通知连接已建立",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        # Keep connection alive and listen for client messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                # Client can send heartbeat or mark-read commands
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                    elif msg.get("type") == "mark_read":
                        # Acknowledge read
                        await websocket.send_json(
                            {
                                "type": "ack",
                                "notification_id": msg.get("notification_id"),
                            }
                        )
                except json.JSONDecodeError:
                    pass
            except TimeoutError:
                # Send heartbeat to keep connection alive
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, user_id)
