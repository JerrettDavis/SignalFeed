"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    email: string;
    username?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.data.user);
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

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
            Profile
          </h1>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)]"
          >
            Back to Map
          </button>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-lg">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--accent-primary)] text-2xl font-bold text-white">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                {user?.username || "Anonymous User"}
              </h2>
              <p className="text-sm text-[color:var(--text-secondary)]">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t border-[color:var(--border)] pt-6">
            <div>
              <label className="block text-sm font-medium text-[color:var(--text-secondary)]">
                Email
              </label>
              <p className="mt-1 text-base text-[color:var(--text-primary)]">
                {user?.email}
              </p>
            </div>
            {user?.username && (
              <div>
                <label className="block text-sm font-medium text-[color:var(--text-secondary)]">
                  Username
                </label>
                <p className="mt-1 text-base text-[color:var(--text-primary)]">
                  {user.username}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[color:var(--text-secondary)]">
                User ID
              </label>
              <p className="mt-1 font-mono text-xs text-[color:var(--text-tertiary)]">
                {user?.id}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-4">
            <p className="text-sm text-[color:var(--text-secondary)]">
              🚧 <strong>Profile editing coming soon!</strong> This page will
              allow you to update your username, profile picture, and other
              settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
