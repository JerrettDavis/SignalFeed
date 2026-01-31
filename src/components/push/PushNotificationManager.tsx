"use client";

import { useCallback, useEffect, useState } from "react";

interface PushNotificationManagerProps {
  isLoggedIn: boolean;
  userId?: string;
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

export function PushNotificationManager({ isLoggedIn, userId, onSubscriptionChange }: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const subscribed = !!subscription;
      setIsSubscribed(subscribed);
      onSubscriptionChange?.(subscribed);
      return subscribed;
    } catch (error) {
      console.error("[Push] Error checking subscription:", error);
      return false;
    }
  }, [onSubscriptionChange]);

  useEffect(() => {
    // Initialize permission state
    const initPermission = () => {
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }
    };
    initPermission();
  }, []);

  useEffect(() => {
    // Check if user is already subscribed
    const checkStatus = async () => {
      if (isLoggedIn && userId && "serviceWorker" in navigator && "PushManager" in window) {
        await checkSubscription();
      }
    };
    checkStatus();
  }, [isLoggedIn, userId, checkSubscription]);

  const requestPermission = useCallback(async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    } catch (error) {
      console.error("[Push] Error requesting permission:", error);
      return "denied";
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      if (!isLoggedIn || !userId) {
        alert("You must be logged in to enable notifications");
        return;
      }

      let perm = permission;
      if (perm === "default") {
        perm = await requestPermission();
      }

      if (perm !== "granted") {
        alert("Notification permission denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        console.error("[Push] VAPID public key not configured");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (response.ok) {
        console.log("[Push] Subscribed successfully");
      } else {
        console.error("[Push] Failed to save subscription");
      }
    } catch (error) {
      console.error("[Push] Error subscribing:", error);
    }
  }, [isLoggedIn, userId, permission, requestPermission]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log("[Push] Unsubscribed successfully");
      }
    } catch (error) {
      console.error("[Push] Error unsubscribing:", error);
    }
  }, []);

  // Expose functions globally for UserDropdown
  useEffect(() => {
    (window as unknown as { pushNotifications?: { subscribe: () => void; unsubscribe: () => void } }).pushNotifications = {
      subscribe,
      unsubscribe,
    };
  }, [subscribe, unsubscribe]);

  return null; // This is a headless component
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}