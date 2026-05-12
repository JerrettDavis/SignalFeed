// Service Worker for SignalFeed PWA
const CACHE_NAME = "signalfeed-v2";
const STATIC_CACHE = ["/"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("[SW] Caching static assets");
      await Promise.allSettled(
        STATIC_CACHE.map((url) =>
          cache.add(url).catch((error) => {
            console.warn("[SW] Failed to cache static asset:", url, error);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve(false);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip caching for:
  // 1. Non-http(s) requests (chrome-extension, etc.)
  // 2. Non-GET requests (POST, PUT, DELETE, PATCH)
  if (!request.url.startsWith("http") || request.method !== "GET") {
    return;
  }

  event.respondWith(handleFetch(request));
});

const handleFetch = async (request) => {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseClone).catch((error) => {
          console.warn("[SW] Failed to cache response:", request.url, error);
        });
      });
    }

    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      return new Response(
        "<!doctype html><title>Offline</title><h1>SignalFeed is offline</h1>",
        {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    return new Response("", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
};

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let data = {
    title: "SightSignal",
    body: "New activity on SightSignal",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/" },
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error("[SW] Error parsing push data:", e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    tag: data.tag || "sightsignal-notification",
    requireInteraction: false,
    data: data.data,
    actions: [
      {
        action: "view",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
