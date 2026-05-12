export type Category = {
  id: string;
  label: string;
};

export type SightingType = {
  id: string;
  label: string;
  categoryId: string;
};

// Make arrays mutable so they can be edited through the admin API
export const categories: Category[] = [
  { id: "cat-nature", label: "Nature" },
  { id: "cat-public-safety", label: "Public Safety" },
  { id: "cat-community", label: "Community" },
  { id: "cat-hazards", label: "Hazards" },
  { id: "cat-infrastructure", label: "Infrastructure" },
  { id: "cat-events", label: "Events" },
  { id: "cat-weather-alerts", label: "Weather Alerts" },
  { id: "cat-seismic-events", label: "Seismic Events" },
];

export const sightingTypes: SightingType[] = [
  { id: "type-birds", label: "Birds", categoryId: "cat-nature" },
  { id: "type-wildlife", label: "Wildlife", categoryId: "cat-nature" },
  { id: "type-roadwork", label: "Construction", categoryId: "cat-hazards" },
  {
    id: "type-road-hazards",
    label: "Road Hazards",
    categoryId: "cat-public-safety",
  },
  { id: "type-events", label: "Community Events", categoryId: "cat-community" },
  { id: "type-geocache", label: "Geocache", categoryId: "cat-community" },
  {
    id: "type-public-safety",
    label: "Safety Alert",
    categoryId: "cat-public-safety",
  },
  {
    id: "type-tornado-alert",
    label: "Tornado Alert",
    categoryId: "cat-weather-alerts",
  },
  {
    id: "type-severe-thunderstorm-alert",
    label: "Severe Thunderstorm Alert",
    categoryId: "cat-weather-alerts",
  },
  {
    id: "type-flood-alert",
    label: "Flood Alert",
    categoryId: "cat-weather-alerts",
  },
  {
    id: "type-winter-storm-alert",
    label: "Winter Storm Alert",
    categoryId: "cat-weather-alerts",
  },
  {
    id: "type-hurricane-alert",
    label: "Tropical Cyclone Alert",
    categoryId: "cat-weather-alerts",
  },
  {
    id: "type-heat-alert",
    label: "Heat Alert",
    categoryId: "cat-weather-alerts",
  },
  {
    id: "type-weather-alert",
    label: "Weather Alert",
    categoryId: "cat-weather-alerts",
  },
  {
    id: "type-earthquake",
    label: "Earthquake",
    categoryId: "cat-seismic-events",
  },
];

export const categoryLabelById = (id: string) =>
  categories.find((category) => category.id === id)?.label ?? id;

export const typeLabelById = (id: string) =>
  sightingTypes.find((type) => type.id === id)?.label ?? id;
