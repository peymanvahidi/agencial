"""Frontend WebSocket connection tracking and subscription management."""

import structlog
from fastapi import WebSocket

logger = structlog.get_logger()


class ConnectionManager:
    """Track frontend WebSocket connections and their subscriptions.

    Maintains two maps for efficient lookups:
    - _connections: WebSocket -> set of subscribed keys ("symbol@interval")
    - _subscriptions: key -> set of subscribed WebSocket connections
    """

    def __init__(self) -> None:
        self._connections: dict[WebSocket, set[str]] = {}
        self._subscriptions: dict[str, set[WebSocket]] = {}

    async def connect(self, ws: WebSocket) -> None:
        """Accept and register a new frontend WebSocket connection."""
        await ws.accept()
        self._connections[ws] = set()
        logger.info("client_connected", total=len(self._connections))

    def disconnect(self, ws: WebSocket) -> set[str]:
        """Remove a frontend connection and clean up all its subscriptions.

        Returns the set of keys that now have zero subscribers
        (so stream manager can stop those upstream streams).
        """
        keys = self._connections.pop(ws, set())
        orphaned_keys: set[str] = set()

        for key in keys:
            subs = self._subscriptions.get(key)
            if subs is not None:
                subs.discard(ws)
                if not subs:
                    del self._subscriptions[key]
                    orphaned_keys.add(key)

        logger.info(
            "client_disconnected",
            removed_keys=len(keys),
            orphaned_streams=len(orphaned_keys),
            total=len(self._connections),
        )
        return orphaned_keys

    def subscribe(self, ws: WebSocket, symbol: str, interval: str) -> bool:
        """Subscribe a client to a symbol@interval key.

        Returns True if this is the first subscriber for this key
        (caller should start the upstream stream).
        """
        key = f"{symbol}@{interval}"

        # Add key to this connection's set
        if ws in self._connections:
            self._connections[ws].add(key)

        # Add connection to the subscription set
        is_first = key not in self._subscriptions or len(self._subscriptions[key]) == 0
        if key not in self._subscriptions:
            self._subscriptions[key] = set()
        self._subscriptions[key].add(ws)

        logger.info(
            "client_subscribed",
            key=key,
            is_first=is_first,
            subscribers=len(self._subscriptions[key]),
        )
        return is_first

    def unsubscribe(self, ws: WebSocket, symbol: str, interval: str) -> bool:
        """Unsubscribe a client from a symbol@interval key.

        Returns True if no subscribers remain for this key
        (caller should stop the upstream stream).
        """
        key = f"{symbol}@{interval}"

        # Remove key from this connection's set
        if ws in self._connections:
            self._connections[ws].discard(key)

        # Remove connection from the subscription set
        subs = self._subscriptions.get(key)
        if subs is not None:
            subs.discard(ws)
            if not subs:
                del self._subscriptions[key]
                logger.info("last_subscriber_removed", key=key)
                return True

        return False

    def get_subscribers(self, key: str) -> set[WebSocket]:
        """Return the set of subscribers for a given key."""
        return self._subscriptions.get(key, set()).copy()

    def get_all_keys(self) -> set[str]:
        """Return all keys that have at least one subscriber."""
        return set(self._subscriptions.keys())

    def has_subscribers(self, key: str) -> bool:
        """Check if any subscribers exist for a key."""
        return key in self._subscriptions and len(self._subscriptions[key]) > 0

    def remove_dead_client(self, ws: WebSocket) -> set[str]:
        """Remove a client that failed to receive messages.

        Same as disconnect but named for clarity when called from fan-out.
        Returns orphaned keys.
        """
        return self.disconnect(ws)
