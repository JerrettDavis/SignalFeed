"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
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
            Messages
          </h1>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)]"
          >
            Back to Map
          </button>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-12 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[color:var(--background)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[color:var(--text-secondary)]"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-[color:var(--text-primary)]">
            No Messages Yet
          </h2>
          <p className="mb-6 text-[color:var(--text-secondary)]">
            Direct messaging is coming soon! You&apos;ll be able to chat with
            other community members about sightings and more.
          </p>
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] p-4">
            <p className="text-sm text-[color:var(--text-secondary)]">
              🚧 <strong>Feature in Development</strong>
              <br />
              We&apos;re building a robust messaging system that will allow you
              to:
            </p>
            <ul className="mt-3 space-y-1 text-left text-sm text-[color:var(--text-secondary)]">
              <li>• Send direct messages to other users</li>
              <li>• Create group conversations</li>
              <li>• Share sightings and locations</li>
              <li>• Get real-time notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
