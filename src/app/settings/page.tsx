"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/");
          return;
        }

        // Check notification status
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setNotificationsEnabled(!!subscription);
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      // @ts-expect-error - Global function from PushNotificationManager
      if (typeof window.unsubscribeFromPush === "function") {
        // @ts-expect-error - Global function
        await window.unsubscribeFromPush();
        setNotificationsEnabled(false);
      }
    } else {
      // @ts-expect-error - Global function from PushNotificationManager
      if (typeof window.subscribeToPush === "function") {
        // @ts-expect-error - Global function
        const success = await window.subscribeToPush();
        if (success) {
          setNotificationsEnabled(true);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--border)] border-t-[color:var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[color:var(--text-primary)]">
            Settings
          </h1>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)]"
          >
            Back to Map
          </button>
        </div>

        <div className="space-y-6">
          {/* Notifications Section */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-[color:var(--text-primary)]">
              Notifications
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[color:var(--text-primary)]">
                  Push Notifications
                </p>
                <p className="text-sm text-[color:var(--text-secondary)]">
                  Get notified when new sightings are reported
                </p>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative h-6 w-11 rounded-full transition ${
                  notificationsEnabled
                    ? "bg-[color:var(--accent-primary)]"
                    : "bg-[color:var(--border)]"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    notificationsEnabled ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-[color:var(--text-primary)]">
              Privacy
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[color:var(--text-primary)]">
                    Show My Location
                  </p>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Display your approximate location to other users
                  </p>
                </div>
                <button className="relative h-6 w-11 rounded-full bg-[color:var(--border)]">
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[color:var(--text-primary)]">
                    Public Profile
                  </p>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Allow others to view your profile and sightings
                  </p>
                </div>
                <button className="relative h-6 w-11 rounded-full bg-[color:var(--accent-primary)]">
                  <div className="absolute left-5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition" />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-[color:var(--text-primary)]">
              Appearance
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--text-secondary)]">
                  Theme
                </label>
                <select className="mt-1 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none">
                  <option>Dark Mode</option>
                  <option>Light Mode</option>
                  <option>Auto (System)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--text-secondary)]">
                  Map Style
                </label>
                <select className="mt-1 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none">
                  <option>Standard</option>
                  <option>Satellite</option>
                  <option>Terrain</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-4">
            <p className="text-sm text-[color:var(--text-secondary)]">
              🚧 <strong>More settings coming soon!</strong> We&apos;re working
              on additional customization options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
