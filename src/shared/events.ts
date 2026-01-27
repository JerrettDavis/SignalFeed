export const EVENTS = {
  sightingsUpdated: "sightsignal:sightings-updated",
  geofencesUpdated: "sightsignal:geofences-updated",
  subscriptionsUpdated: "sightsignal:subscriptions-updated",
  geofenceSelected: "sightsignal:geofence-selected",
  sightingSelected: "sightsignal:sighting-selected",
} as const;

export const dispatchEvent = (name: string, detail?: unknown) => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(name, { detail }));
};
