export const EVENTS = {
  sightingsUpdated: "sightsignal:sightings-updated",
  geofencesUpdated: "sightsignal:geofences-updated",
  subscriptionsUpdated: "sightsignal:subscriptions-updated",
  geofenceSelected: "sightsignal:geofence-selected",
  sightingSelected: "sightsignal:sighting-selected",
  reportLocationSet: "sightsignal:report-location-set",
  reportLocationUpdated: "sightsignal:report-location-updated",
  reportFormOpened: "sightsignal:report-form-opened",
  reportFormClosed: "sightsignal:report-form-closed",
} as const;

export const dispatchEvent = (name: string, detail?: unknown) => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(name, { detail }));
};
