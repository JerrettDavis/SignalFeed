"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UserLocationTrackerProps {
  isLoggedIn: boolean;
  userId: string | undefined;
  followMeEnabled: boolean; // From settings
}

export function UserLocationTracker({
  isLoggedIn,
  userId,
  followMeEnabled,
}: UserLocationTrackerProps) {
  const watchIdRef = useRef<number | null>(null);
  const [tracking, setTracking] = useState(false);

  const shareLocation = useCallback(
    async (position: GeolocationPosition) => {
      if (!isLoggedIn || !userId || !followMeEnabled) return;

      try {
        await fetch("/api/users/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            followMeMode: followMeEnabled,
          }),
        });
      } catch (error) {
        console.error("[LocationTracker] Failed to share location:", error);
      }
    },
    [isLoggedIn, userId, followMeEnabled]
  );

  useEffect(() => {
    // Only track if logged in and follow me is enabled
    if (!isLoggedIn || !userId || !followMeEnabled) {
      // Stop tracking if conditions not met
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        // Use setTimeout to avoid setState during render
        setTimeout(() => setTracking(false), 0);

        // Delete location from server
        fetch("/api/users/location", { method: "DELETE" }).catch((err) =>
          console.error("[LocationTracker] Failed to delete location:", err)
        );
      }
      return;
    }

    // Start tracking
    if ("geolocation" in navigator && watchIdRef.current === null) {
      console.log("[LocationTracker] Starting location tracking");
      setTimeout(() => setTracking(true), 0);

      watchIdRef.current = navigator.geolocation.watchPosition(
        shareLocation,
        (error) => {
          console.error("[LocationTracker] Geolocation error:", error);
          setTimeout(() => setTracking(false), 0);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isLoggedIn, userId, followMeEnabled, shareLocation]);

  // Show tracking indicator
  if (!tracking) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[500] flex items-center gap-2 rounded-lg border border-[color:var(--accent-primary)] bg-[color:var(--surface)] px-3 py-2 shadow-lg">
      <div className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--accent-primary)]" />
      <span className="text-xs text-[color:var(--text-secondary)]">
        Sharing location
      </span>
    </div>
  );
}
