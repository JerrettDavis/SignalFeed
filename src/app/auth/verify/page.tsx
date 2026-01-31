"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your magic link...");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        setStatus("error");
        setMessage("No token provided");
      }, 0);
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`/api/auth/verify?token=${token}`);
        
        if (response.ok) {
          setStatus("success");
          setMessage("Successfully logged in! Redirecting...");
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          const data = await response.json();
          setStatus("error");
          setMessage(data.error?.message || "Invalid or expired link");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to verify link");
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center shadow-2xl">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--border)] border-t-[color:var(--accent-primary)]" />
            <h1 className="text-xl font-semibold text-[color:var(--text-primary)]">{message}</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent-success)]/10">
              <svg className="h-6 w-6 text-[color:var(--accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[color:var(--text-primary)]">{message}</h1>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent-danger)]/10">
              <svg className="h-6 w-6 text-[color:var(--accent-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mb-2 text-xl font-semibold text-[color:var(--text-primary)]">Verification Failed</h1>
            <p className="mb-4 text-sm text-[color:var(--text-secondary)]">{message}</p>
            <button
              onClick={() => router.push("/")}
              className="rounded-lg bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[color:var(--accent-hover)]"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}