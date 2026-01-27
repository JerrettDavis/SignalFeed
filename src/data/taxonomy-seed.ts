/**
 * Comprehensive Taxonomy Seed Data for SightSignal
 * Production-ready data for Tulsa launch
 *
 * Structure:
 * - 15 core categories with icons and descriptions
 * - 75 subcategories organized under categories
 * - 145 sighting types with tags, organized under subcategories
 */

import type {
  Category,
  CategoryId,
  Subcategory,
  SubcategoryId,
  SightingType,
  SightingTypeId,
} from "@/domain/taxonomy/taxonomy";

// ============================================================================
// CATEGORIES (15)
// ============================================================================

export const categories: Category[] = [
  {
    id: "cat-community-events" as CategoryId,
    label: "Community Events",
    icon: "🎪",
    description: "Local gatherings, sales, festivals, and community activities",
  },
  {
    id: "cat-public-safety" as CategoryId,
    label: "Public Safety",
    icon: "🚨",
    description: "Emergency response, safety alerts, and urgent situations",
  },
  {
    id: "cat-law-enforcement" as CategoryId,
    label: "Law Enforcement",
    icon: "👮",
    description: "Police, sheriff, and federal agent activity by type",
  },
  {
    id: "cat-lost-found" as CategoryId,
    label: "Lost & Found",
    icon: "🔍",
    description: "Lost and found pets, personal items, and valuables",
  },
  {
    id: "cat-curb-alerts" as CategoryId,
    label: "Curb Alerts",
    icon: "🪑",
    description: "Free furniture, bulk trash, and curbside treasures",
  },
  {
    id: "cat-food-drink" as CategoryId,
    label: "Food & Drink",
    icon: "🍔",
    description: "Food trucks, restaurant deals, and culinary discoveries",
  },
  {
    id: "cat-wildlife" as CategoryId,
    label: "Wildlife",
    icon: "🦌",
    description: "Wild animals, domestic animals, birds, and nature sightings",
  },
  {
    id: "cat-weather" as CategoryId,
    label: "Weather",
    icon: "⛈️",
    description: "Severe weather, atmospheric conditions, and climate events",
  },
  {
    id: "cat-infrastructure" as CategoryId,
    label: "Infrastructure",
    icon: "🏗️",
    description: "Road work, utilities, construction, and service disruptions",
  },
  {
    id: "cat-hazards" as CategoryId,
    label: "Hazards",
    icon: "⚠️",
    description: "Road hazards, environmental dangers, and unsafe conditions",
  },
  {
    id: "cat-transportation" as CategoryId,
    label: "Transportation",
    icon: "🚗",
    description: "Traffic conditions, accidents, parking, and transit updates",
  },
  {
    id: "cat-market-activity" as CategoryId,
    label: "Market Activity",
    icon: "🛒",
    description:
      "Farmers markets, craft fairs, vendor pop-ups, and local commerce",
  },
  {
    id: "cat-urban-finds" as CategoryId,
    label: "Urban Finds",
    icon: "📸",
    description:
      "Street art, murals, photo opportunities, and urban discoveries",
  },
  {
    id: "cat-automotive" as CategoryId,
    label: "Automotive",
    icon: "🏎️",
    description:
      "Car spotting, automotive meetups, and vehicle enthusiast activities",
  },
  {
    id: "cat-civic-engagement" as CategoryId,
    label: "Civic Engagement",
    icon: "🗳️",
    description: "Protests, rallies, town halls, and civic participation",
  },
];

// ============================================================================
// SUBCATEGORIES (75)
// ============================================================================

export const subcategories: Subcategory[] = [
  // Community Events (5)
  {
    id: "sub-garage-sales" as SubcategoryId,
    label: "Garage & Yard Sales",
    categoryId: "cat-community-events" as CategoryId,
    description: "Private sales at homes and properties",
  },
  {
    id: "sub-festivals" as SubcategoryId,
    label: "Festivals & Fairs",
    categoryId: "cat-community-events" as CategoryId,
    description: "Large community celebrations and festivals",
  },
  {
    id: "sub-neighborhood-events" as SubcategoryId,
    label: "Neighborhood Events",
    categoryId: "cat-community-events" as CategoryId,
    description: "Block parties, HOA events, and local gatherings",
  },
  {
    id: "sub-charity-events" as SubcategoryId,
    label: "Charity & Fundraising",
    categoryId: "cat-community-events" as CategoryId,
    description: "Charitable events and fundraising activities",
  },
  {
    id: "sub-pop-ups" as SubcategoryId,
    label: "Pop-up Events",
    categoryId: "cat-community-events" as CategoryId,
    description: "Temporary events and spontaneous gatherings",
  },

  // Public Safety (5)
  {
    id: "sub-emergency-response" as SubcategoryId,
    label: "Emergency Response",
    categoryId: "cat-public-safety" as CategoryId,
    description: "Active emergency situations requiring immediate attention",
  },
  {
    id: "sub-fire-response" as SubcategoryId,
    label: "Fire Response",
    categoryId: "cat-public-safety" as CategoryId,
    description: "Fire department activity and fire-related emergencies",
  },
  {
    id: "sub-medical-emergency" as SubcategoryId,
    label: "Medical Emergency",
    categoryId: "cat-public-safety" as CategoryId,
    description: "EMS and medical emergency response",
  },
  {
    id: "sub-safety-alerts" as SubcategoryId,
    label: "Safety Alerts",
    categoryId: "cat-public-safety" as CategoryId,
    description: "General safety warnings and public alerts",
  },
  {
    id: "sub-suspicious-activity" as SubcategoryId,
    label: "Suspicious Activity",
    categoryId: "cat-public-safety" as CategoryId,
    description: "Unusual or concerning behavior requiring awareness",
  },

  // Law Enforcement (6)
  {
    id: "sub-police-patrol" as SubcategoryId,
    label: "Police Patrol",
    categoryId: "cat-law-enforcement" as CategoryId,
    description: "Regular police presence and patrol activity",
  },
  {
    id: "sub-traffic-enforcement" as SubcategoryId,
    label: "Traffic Enforcement",
    categoryId: "cat-law-enforcement" as CategoryId,
    description: "Speed traps, DUI checkpoints, and traffic stops",
  },
  {
    id: "sub-sheriff-activity" as SubcategoryId,
    label: "Sheriff Activity",
    categoryId: "cat-law-enforcement" as CategoryId,
    description: "County sheriff and deputy activity",
  },
  {
    id: "sub-federal-agents" as SubcategoryId,
    label: "Federal Agents",
    categoryId: "cat-law-enforcement" as CategoryId,
    description: "FBI, DEA, ATF, and other federal law enforcement",
  },
  {
    id: "sub-investigations" as SubcategoryId,
    label: "Investigations",
    categoryId: "cat-law-enforcement" as CategoryId,
    description: "Detective work and active investigations",
  },
  {
    id: "sub-arrests" as SubcategoryId,
    label: "Arrests",
    categoryId: "cat-law-enforcement" as CategoryId,
    description: "Arrest activity and custody situations",
  },

  // Lost & Found (4)
  {
    id: "sub-lost-pets" as SubcategoryId,
    label: "Lost Pets",
    categoryId: "cat-lost-found" as CategoryId,
    description: "Missing cats, dogs, and other pets",
  },
  {
    id: "sub-found-pets" as SubcategoryId,
    label: "Found Pets",
    categoryId: "cat-lost-found" as CategoryId,
    description: "Located pets seeking owners",
  },
  {
    id: "sub-lost-items" as SubcategoryId,
    label: "Lost Items",
    categoryId: "cat-lost-found" as CategoryId,
    description: "Missing personal belongings and valuables",
  },
  {
    id: "sub-found-items" as SubcategoryId,
    label: "Found Items",
    categoryId: "cat-lost-found" as CategoryId,
    description: "Discovered items seeking owners",
  },

  // Curb Alerts (4)
  {
    id: "sub-furniture" as SubcategoryId,
    label: "Free Furniture",
    categoryId: "cat-curb-alerts" as CategoryId,
    description: "Couches, chairs, tables, and home furnishings",
  },
  {
    id: "sub-appliances" as SubcategoryId,
    label: "Appliances & Electronics",
    categoryId: "cat-curb-alerts" as CategoryId,
    description: "Working or repairable household items",
  },
  {
    id: "sub-building-materials" as SubcategoryId,
    label: "Building Materials",
    categoryId: "cat-curb-alerts" as CategoryId,
    description: "Lumber, fixtures, and construction supplies",
  },
  {
    id: "sub-bulk-trash" as SubcategoryId,
    label: "Bulk Trash",
    categoryId: "cat-curb-alerts" as CategoryId,
    description: "Large items and scheduled bulk pickup alerts",
  },

  // Food & Drink (5)
  {
    id: "sub-food-trucks" as SubcategoryId,
    label: "Food Trucks",
    categoryId: "cat-food-drink" as CategoryId,
    description: "Mobile food vendors and truck locations",
  },
  {
    id: "sub-restaurant-deals" as SubcategoryId,
    label: "Restaurant Deals",
    categoryId: "cat-food-drink" as CategoryId,
    description: "Special offers, happy hours, and promotions",
  },
  {
    id: "sub-new-openings" as SubcategoryId,
    label: "New Openings",
    categoryId: "cat-food-drink" as CategoryId,
    description: "Newly opened restaurants and cafes",
  },
  {
    id: "sub-food-samples" as SubcategoryId,
    label: "Free Samples & Tastings",
    categoryId: "cat-food-drink" as CategoryId,
    description: "Food sampling events and promotional tastings",
  },
  {
    id: "sub-specialty-food" as SubcategoryId,
    label: "Specialty Food",
    categoryId: "cat-food-drink" as CategoryId,
    description: "Unique culinary finds and specialty items",
  },

  // Wildlife (6)
  {
    id: "sub-wild-animals" as SubcategoryId,
    label: "Wild Animals",
    categoryId: "cat-wildlife" as CategoryId,
    description: "Native wildlife and undomesticated animals",
  },
  {
    id: "sub-birds" as SubcategoryId,
    label: "Birds",
    categoryId: "cat-wildlife" as CategoryId,
    description: "Bird sightings and avian activity",
  },
  {
    id: "sub-domestic-animals" as SubcategoryId,
    label: "Domestic Animals",
    categoryId: "cat-wildlife" as CategoryId,
    description: "Pets and farm animals in public spaces",
  },
  {
    id: "sub-animal-hazards" as SubcategoryId,
    label: "Animal Hazards",
    categoryId: "cat-wildlife" as CategoryId,
    description: "Dangerous or problematic animal encounters",
  },
  {
    id: "sub-marine-life" as SubcategoryId,
    label: "Marine & Aquatic",
    categoryId: "cat-wildlife" as CategoryId,
    description: "Fish, turtles, and water-based wildlife",
  },
  {
    id: "sub-insects" as SubcategoryId,
    label: "Insects & Invertebrates",
    categoryId: "cat-wildlife" as CategoryId,
    description: "Notable insect and bug sightings",
  },

  // Weather (5)
  {
    id: "sub-severe-weather" as SubcategoryId,
    label: "Severe Weather",
    categoryId: "cat-weather" as CategoryId,
    description: "Tornadoes, severe storms, and dangerous conditions",
  },
  {
    id: "sub-precipitation" as SubcategoryId,
    label: "Precipitation",
    categoryId: "cat-weather" as CategoryId,
    description: "Rain, snow, hail, and ice conditions",
  },
  {
    id: "sub-atmospheric" as SubcategoryId,
    label: "Atmospheric Phenomena",
    categoryId: "cat-weather" as CategoryId,
    description: "Rainbows, clouds, lightning, and sky events",
  },
  {
    id: "sub-wind" as SubcategoryId,
    label: "Wind Events",
    categoryId: "cat-weather" as CategoryId,
    description: "High winds, gusts, and wind damage",
  },
  {
    id: "sub-temperature" as SubcategoryId,
    label: "Temperature Extremes",
    categoryId: "cat-weather" as CategoryId,
    description: "Heat waves, cold snaps, and unusual temperatures",
  },

  // Infrastructure (5)
  {
    id: "sub-road-work" as SubcategoryId,
    label: "Road Work",
    categoryId: "cat-infrastructure" as CategoryId,
    description: "Street repairs, paving, and road maintenance",
  },
  {
    id: "sub-utility-work" as SubcategoryId,
    label: "Utility Work",
    categoryId: "cat-infrastructure" as CategoryId,
    description: "Power, water, gas, and telecom infrastructure",
  },
  {
    id: "sub-construction" as SubcategoryId,
    label: "Construction",
    categoryId: "cat-infrastructure" as CategoryId,
    description: "New building and major construction projects",
  },
  {
    id: "sub-closures" as SubcategoryId,
    label: "Closures",
    categoryId: "cat-infrastructure" as CategoryId,
    description: "Road, bridge, and facility closures",
  },
  {
    id: "sub-service-disruption" as SubcategoryId,
    label: "Service Disruptions",
    categoryId: "cat-infrastructure" as CategoryId,
    description: "Power outages and service interruptions",
  },

  // Hazards (5)
  {
    id: "sub-road-hazards" as SubcategoryId,
    label: "Road Hazards",
    categoryId: "cat-hazards" as CategoryId,
    description: "Potholes, debris, and dangerous road conditions",
  },
  {
    id: "sub-environmental-hazards" as SubcategoryId,
    label: "Environmental Hazards",
    categoryId: "cat-hazards" as CategoryId,
    description: "Pollution, spills, and environmental dangers",
  },
  {
    id: "sub-structural-hazards" as SubcategoryId,
    label: "Structural Hazards",
    categoryId: "cat-hazards" as CategoryId,
    description: "Damaged buildings, falling debris, and unsafe structures",
  },
  {
    id: "sub-natural-hazards" as SubcategoryId,
    label: "Natural Hazards",
    categoryId: "cat-hazards" as CategoryId,
    description: "Flooding, fallen trees, and nature-related dangers",
  },
  {
    id: "sub-public-health" as SubcategoryId,
    label: "Public Health Hazards",
    categoryId: "cat-hazards" as CategoryId,
    description: "Contamination, disease risks, and health concerns",
  },

  // Transportation (5)
  {
    id: "sub-traffic-conditions" as SubcategoryId,
    label: "Traffic Conditions",
    categoryId: "cat-transportation" as CategoryId,
    description: "Congestion, delays, and flow information",
  },
  {
    id: "sub-accidents" as SubcategoryId,
    label: "Accidents",
    categoryId: "cat-transportation" as CategoryId,
    description: "Vehicle collisions and crashes",
  },
  {
    id: "sub-parking" as SubcategoryId,
    label: "Parking",
    categoryId: "cat-transportation" as CategoryId,
    description: "Available parking spots and parking information",
  },
  {
    id: "sub-public-transit" as SubcategoryId,
    label: "Public Transit",
    categoryId: "cat-transportation" as CategoryId,
    description: "Bus, train, and transit updates",
  },
  {
    id: "sub-bike-paths" as SubcategoryId,
    label: "Bike & Pedestrian",
    categoryId: "cat-transportation" as CategoryId,
    description: "Bicycle and pedestrian path conditions",
  },

  // Market Activity (5)
  {
    id: "sub-farmers-markets" as SubcategoryId,
    label: "Farmers Markets",
    categoryId: "cat-market-activity" as CategoryId,
    description: "Local produce and farmers market locations",
  },
  {
    id: "sub-craft-fairs" as SubcategoryId,
    label: "Craft Fairs",
    categoryId: "cat-market-activity" as CategoryId,
    description: "Handmade goods and artisan markets",
  },
  {
    id: "sub-vendor-popups" as SubcategoryId,
    label: "Vendor Pop-ups",
    categoryId: "cat-market-activity" as CategoryId,
    description: "Temporary vendor setups and street vendors",
  },
  {
    id: "sub-flea-markets" as SubcategoryId,
    label: "Flea Markets",
    categoryId: "cat-market-activity" as CategoryId,
    description: "Secondhand goods and bargain markets",
  },
  {
    id: "sub-holiday-markets" as SubcategoryId,
    label: "Holiday Markets",
    categoryId: "cat-market-activity" as CategoryId,
    description: "Seasonal and holiday-themed markets",
  },

  // Urban Finds (5)
  {
    id: "sub-street-art" as SubcategoryId,
    label: "Street Art",
    categoryId: "cat-urban-finds" as CategoryId,
    description: "Graffiti, murals, and urban artwork",
  },
  {
    id: "sub-photo-ops" as SubcategoryId,
    label: "Photo Opportunities",
    categoryId: "cat-urban-finds" as CategoryId,
    description: "Scenic views and picture-worthy locations",
  },
  {
    id: "sub-public-art" as SubcategoryId,
    label: "Public Art Installations",
    categoryId: "cat-urban-finds" as CategoryId,
    description: "Sculptures, monuments, and public art",
  },
  {
    id: "sub-urban-nature" as SubcategoryId,
    label: "Urban Nature",
    categoryId: "cat-urban-finds" as CategoryId,
    description: "City gardens, green spaces, and natural beauty",
  },
  {
    id: "sub-architecture" as SubcategoryId,
    label: "Architecture",
    categoryId: "cat-urban-finds" as CategoryId,
    description: "Notable buildings and architectural features",
  },

  // Automotive (5)
  {
    id: "sub-exotic-cars" as SubcategoryId,
    label: "Exotic & Luxury Cars",
    categoryId: "cat-automotive" as CategoryId,
    description: "High-end and exotic vehicle sightings",
  },
  {
    id: "sub-classic-cars" as SubcategoryId,
    label: "Classic Cars",
    categoryId: "cat-automotive" as CategoryId,
    description: "Vintage and antique automobiles",
  },
  {
    id: "sub-car-meetups" as SubcategoryId,
    label: "Car Meetups",
    categoryId: "cat-automotive" as CategoryId,
    description: "Automotive gatherings and shows",
  },
  {
    id: "sub-modified-vehicles" as SubcategoryId,
    label: "Modified Vehicles",
    categoryId: "cat-automotive" as CategoryId,
    description: "Custom and modified cars and trucks",
  },
  {
    id: "sub-commercial-vehicles" as SubcategoryId,
    label: "Special Vehicles",
    categoryId: "cat-automotive" as CategoryId,
    description: "Unusual trucks, equipment, and specialty vehicles",
  },

  // Civic Engagement (5)
  {
    id: "sub-protests" as SubcategoryId,
    label: "Protests & Demonstrations",
    categoryId: "cat-civic-engagement" as CategoryId,
    description: "Public protests and organized demonstrations",
  },
  {
    id: "sub-rallies" as SubcategoryId,
    label: "Political Rallies",
    categoryId: "cat-civic-engagement" as CategoryId,
    description: "Political gatherings and campaign events",
  },
  {
    id: "sub-town-halls" as SubcategoryId,
    label: "Town Halls",
    categoryId: "cat-civic-engagement" as CategoryId,
    description: "Community meetings and public forums",
  },
  {
    id: "sub-petitioning" as SubcategoryId,
    label: "Petitioning",
    categoryId: "cat-civic-engagement" as CategoryId,
    description: "Signature gathering and petition drives",
  },
  {
    id: "sub-voter-activity" as SubcategoryId,
    label: "Voter Activity",
    categoryId: "cat-civic-engagement" as CategoryId,
    description: "Polling locations, registration drives, and voting events",
  },
];

// ============================================================================
// SIGHTING TYPES (145)
// ============================================================================

export const sightingTypes: SightingType[] = [
  // Community Events - Garage Sales (8)
  {
    id: "type-garage-sale" as SightingTypeId,
    label: "Garage Sale",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-garage-sales" as SubcategoryId,
    tags: ["sale", "bargains", "household"],
    icon: "🏠",
  },
  {
    id: "type-yard-sale" as SightingTypeId,
    label: "Yard Sale",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-garage-sales" as SubcategoryId,
    tags: ["sale", "outdoor", "bargains"],
  },
  {
    id: "type-estate-sale" as SightingTypeId,
    label: "Estate Sale",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-garage-sales" as SubcategoryId,
    tags: ["sale", "antiques", "high-value"],
  },
  {
    id: "type-moving-sale" as SightingTypeId,
    label: "Moving Sale",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-garage-sales" as SubcategoryId,
    tags: ["sale", "liquidation", "furniture"],
  },
  {
    id: "type-multi-family-sale" as SightingTypeId,
    label: "Multi-Family Sale",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-garage-sales" as SubcategoryId,
    tags: ["sale", "large", "variety"],
  },

  // Community Events - Festivals (7)
  {
    id: "type-music-festival" as SightingTypeId,
    label: "Music Festival",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-festivals" as SubcategoryId,
    tags: ["music", "entertainment", "large-crowd"],
    icon: "🎵",
  },
  {
    id: "type-food-festival" as SightingTypeId,
    label: "Food Festival",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-festivals" as SubcategoryId,
    tags: ["food", "culinary", "vendors"],
  },
  {
    id: "type-art-festival" as SightingTypeId,
    label: "Art Festival",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-festivals" as SubcategoryId,
    tags: ["art", "culture", "exhibits"],
  },
  {
    id: "type-holiday-festival" as SightingTypeId,
    label: "Holiday Festival",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-festivals" as SubcategoryId,
    tags: ["holiday", "seasonal", "celebration"],
  },
  {
    id: "type-street-fair" as SightingTypeId,
    label: "Street Fair",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-festivals" as SubcategoryId,
    tags: ["vendors", "street", "shopping"],
  },

  // Community Events - Neighborhood (5)
  {
    id: "type-block-party" as SightingTypeId,
    label: "Block Party",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-neighborhood-events" as SubcategoryId,
    tags: ["neighborhood", "social", "street-closure"],
    icon: "🎉",
  },
  {
    id: "type-hoa-meeting" as SightingTypeId,
    label: "HOA Meeting",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-neighborhood-events" as SubcategoryId,
    tags: ["meeting", "residents", "official"],
  },
  {
    id: "type-neighborhood-watch" as SightingTypeId,
    label: "Neighborhood Watch",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-neighborhood-events" as SubcategoryId,
    tags: ["safety", "community", "meeting"],
  },

  // Community Events - Charity (4)
  {
    id: "type-charity-run" as SightingTypeId,
    label: "Charity Run/Walk",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-charity-events" as SubcategoryId,
    tags: ["charity", "fitness", "fundraiser"],
    icon: "🏃",
  },
  {
    id: "type-bake-sale" as SightingTypeId,
    label: "Bake Sale",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-charity-events" as SubcategoryId,
    tags: ["fundraiser", "food", "homemade"],
  },
  {
    id: "type-car-wash-fundraiser" as SightingTypeId,
    label: "Fundraiser Car Wash",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-charity-events" as SubcategoryId,
    tags: ["fundraiser", "service", "charity"],
  },

  // Community Events - Pop-ups (3)
  {
    id: "type-flash-mob" as SightingTypeId,
    label: "Flash Mob",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-pop-ups" as SubcategoryId,
    tags: ["performance", "spontaneous", "entertainment"],
  },
  {
    id: "type-popup-shop" as SightingTypeId,
    label: "Pop-up Shop",
    categoryId: "cat-community-events" as CategoryId,
    subcategoryId: "sub-pop-ups" as SubcategoryId,
    tags: ["shopping", "temporary", "retail"],
  },

  // Public Safety - Emergency Response (6)
  {
    id: "type-structure-fire" as SightingTypeId,
    label: "Structure Fire",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-fire-response" as SubcategoryId,
    tags: ["fire", "emergency", "evacuate"],
    icon: "🔥",
  },
  {
    id: "type-vehicle-fire" as SightingTypeId,
    label: "Vehicle Fire",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-fire-response" as SubcategoryId,
    tags: ["fire", "vehicle", "emergency"],
  },
  {
    id: "type-wildfire" as SightingTypeId,
    label: "Wildfire",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-fire-response" as SubcategoryId,
    tags: ["fire", "natural", "evacuate"],
  },
  {
    id: "type-medical-emergency" as SightingTypeId,
    label: "Medical Emergency",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-medical-emergency" as SubcategoryId,
    tags: ["ems", "ambulance", "urgent"],
    icon: "🚑",
  },
  {
    id: "type-cardiac-arrest" as SightingTypeId,
    label: "Cardiac Emergency",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-medical-emergency" as SubcategoryId,
    tags: ["ems", "critical", "life-threatening"],
  },
  {
    id: "type-hazmat" as SightingTypeId,
    label: "Hazmat Situation",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-emergency-response" as SubcategoryId,
    tags: ["hazmat", "emergency", "evacuate"],
    icon: "☢️",
  },

  // Public Safety - Safety Alerts (4)
  {
    id: "type-active-shooter" as SightingTypeId,
    label: "Active Threat",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-safety-alerts" as SubcategoryId,
    tags: ["emergency", "danger", "shelter"],
    icon: "🚨",
  },
  {
    id: "type-gas-leak" as SightingTypeId,
    label: "Gas Leak",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-safety-alerts" as SubcategoryId,
    tags: ["gas", "evacuate", "utility"],
  },
  {
    id: "type-downed-powerline" as SightingTypeId,
    label: "Downed Power Line",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-safety-alerts" as SubcategoryId,
    tags: ["electricity", "danger", "avoid"],
  },
  {
    id: "type-suspicious-package" as SightingTypeId,
    label: "Suspicious Package",
    categoryId: "cat-public-safety" as CategoryId,
    subcategoryId: "sub-suspicious-activity" as SubcategoryId,
    tags: ["suspicious", "alert", "investigate"],
  },

  // Law Enforcement - Traffic Enforcement (6)
  {
    id: "type-speed-trap" as SightingTypeId,
    label: "Speed Trap",
    categoryId: "cat-law-enforcement" as CategoryId,
    subcategoryId: "sub-traffic-enforcement" as SubcategoryId,
    tags: ["police", "traffic", "radar"],
    icon: "🚔",
  },
  {
    id: "type-dui-checkpoint" as SightingTypeId,
    label: "DUI Checkpoint",
    categoryId: "cat-law-enforcement" as CategoryId,
    subcategoryId: "sub-traffic-enforcement" as SubcategoryId,
    tags: ["police", "checkpoint", "traffic"],
  },
  {
    id: "type-license-checkpoint" as SightingTypeId,
    label: "License Checkpoint",
    categoryId: "cat-law-enforcement" as CategoryId,
    subcategoryId: "sub-traffic-enforcement" as SubcategoryId,
    tags: ["police", "checkpoint", "documents"],
  },
  {
    id: "type-traffic-stop" as SightingTypeId,
    label: "Traffic Stop",
    categoryId: "cat-law-enforcement" as CategoryId,
    subcategoryId: "sub-traffic-enforcement" as SubcategoryId,
    tags: ["police", "traffic", "stop"],
  },

  // Law Enforcement - Police Activity (5)
  {
    id: "type-police-pursuit" as SightingTypeId,
    label: "Police Pursuit",
    categoryId: "cat-law-enforcement" as CategoryId,
    subcategoryId: "sub-police-patrol" as SubcategoryId,
    tags: ["police", "chase", "emergency"],
    icon: "🚨",
  },
  {
    id: "type-k9-unit" as SightingTypeId,
    label: "K-9 Unit",
    categoryId: "cat-law-enforcement" as CategoryId,
    subcategoryId: "sub-police-patrol" as SubcategoryId,
    tags: ["police", "k9", "search"],
  },
  {
    id: "type-swat-team" as SightingTypeId,
    label: "SWAT Team",
    categoryId: "cat-law-enforcement" as CategoryId,
    subcategoryId: "sub-police-patrol" as SubcategoryId,
    tags: ["police", "tactical", "emergency"],
  },
  {
    id: "type-sheriffs-deputy" as SightingTypeId,
    label: "Sheriff's Deputy",
    categoryId: "cat-law-enforcement" as CategoryId,
    subcategoryId: "sub-sheriff-activity" as SubcategoryId,
    tags: ["sheriff", "county", "patrol"],
  },
  {
    id: "type-arrest-in-progress" as SightingTypeId,
    label: "Arrest in Progress",
    categoryId: "cat-law-enforcement" as CategoryId,
    subcategoryId: "sub-arrests" as SubcategoryId,
    tags: ["police", "arrest", "custody"],
  },

  // Lost & Found - Pets (8)
  {
    id: "type-lost-dog" as SightingTypeId,
    label: "Lost Dog",
    categoryId: "cat-lost-found" as CategoryId,
    subcategoryId: "sub-lost-pets" as SubcategoryId,
    tags: ["dog", "lost", "missing"],
    icon: "🐕",
  },
  {
    id: "type-lost-cat" as SightingTypeId,
    label: "Lost Cat",
    categoryId: "cat-lost-found" as CategoryId,
    subcategoryId: "sub-lost-pets" as SubcategoryId,
    tags: ["cat", "lost", "missing"],
    icon: "🐈",
  },
  {
    id: "type-found-dog" as SightingTypeId,
    label: "Found Dog",
    categoryId: "cat-lost-found" as CategoryId,
    subcategoryId: "sub-found-pets" as SubcategoryId,
    tags: ["dog", "found", "stray"],
    icon: "🐕",
  },
  {
    id: "type-found-cat" as SightingTypeId,
    label: "Found Cat",
    categoryId: "cat-lost-found" as CategoryId,
    subcategoryId: "sub-found-pets" as SubcategoryId,
    tags: ["cat", "found", "stray"],
    icon: "🐈",
  },
  {
    id: "type-lost-exotic-pet" as SightingTypeId,
    label: "Lost Exotic Pet",
    categoryId: "cat-lost-found" as CategoryId,
    subcategoryId: "sub-lost-pets" as SubcategoryId,
    tags: ["exotic", "lost", "unusual"],
  },

  // Lost & Found - Items (6)
  {
    id: "type-lost-wallet" as SightingTypeId,
    label: "Lost Wallet",
    categoryId: "cat-lost-found" as CategoryId,
    subcategoryId: "sub-lost-items" as SubcategoryId,
    tags: ["wallet", "valuables", "lost"],
    icon: "👛",
  },
  {
    id: "type-lost-phone" as SightingTypeId,
    label: "Lost Phone",
    categoryId: "cat-lost-found" as CategoryId,
    subcategoryId: "sub-lost-items" as SubcategoryId,
    tags: ["phone", "electronics", "lost"],
  },
  {
    id: "type-lost-keys" as SightingTypeId,
    label: "Lost Keys",
    categoryId: "cat-lost-found" as CategoryId,
    subcategoryId: "sub-lost-items" as SubcategoryId,
    tags: ["keys", "lost", "important"],
    icon: "🔑",
  },
  {
    id: "type-found-jewelry" as SightingTypeId,
    label: "Found Jewelry",
    categoryId: "cat-lost-found" as CategoryId,
    subcategoryId: "sub-found-items" as SubcategoryId,
    tags: ["jewelry", "found", "valuable"],
  },

  // Curb Alerts (10)
  {
    id: "type-free-couch" as SightingTypeId,
    label: "Free Couch",
    categoryId: "cat-curb-alerts" as CategoryId,
    subcategoryId: "sub-furniture" as SubcategoryId,
    tags: ["furniture", "free", "seating"],
    icon: "🛋️",
  },
  {
    id: "type-free-chair" as SightingTypeId,
    label: "Free Chair",
    categoryId: "cat-curb-alerts" as CategoryId,
    subcategoryId: "sub-furniture" as SubcategoryId,
    tags: ["furniture", "free", "seating"],
  },
  {
    id: "type-free-table" as SightingTypeId,
    label: "Free Table",
    categoryId: "cat-curb-alerts" as CategoryId,
    subcategoryId: "sub-furniture" as SubcategoryId,
    tags: ["furniture", "free", "dining"],
  },
  {
    id: "type-free-mattress" as SightingTypeId,
    label: "Free Mattress",
    categoryId: "cat-curb-alerts" as CategoryId,
    subcategoryId: "sub-furniture" as SubcategoryId,
    tags: ["furniture", "free", "bedroom"],
  },
  {
    id: "type-free-appliance" as SightingTypeId,
    label: "Free Appliance",
    categoryId: "cat-curb-alerts" as CategoryId,
    subcategoryId: "sub-appliances" as SubcategoryId,
    tags: ["appliance", "free", "household"],
  },
  {
    id: "type-free-electronics" as SightingTypeId,
    label: "Free Electronics",
    categoryId: "cat-curb-alerts" as CategoryId,
    subcategoryId: "sub-appliances" as SubcategoryId,
    tags: ["electronics", "free", "tech"],
  },
  {
    id: "type-free-lumber" as SightingTypeId,
    label: "Free Lumber",
    categoryId: "cat-curb-alerts" as CategoryId,
    subcategoryId: "sub-building-materials" as SubcategoryId,
    tags: ["lumber", "free", "construction"],
  },
  {
    id: "type-bulk-pickup" as SightingTypeId,
    label: "Bulk Trash Pickup",
    categoryId: "cat-curb-alerts" as CategoryId,
    subcategoryId: "sub-bulk-trash" as SubcategoryId,
    tags: ["trash", "pickup", "scheduled"],
  },

  // Food & Drink (12)
  {
    id: "type-taco-truck" as SightingTypeId,
    label: "Taco Truck",
    categoryId: "cat-food-drink" as CategoryId,
    subcategoryId: "sub-food-trucks" as SubcategoryId,
    tags: ["food-truck", "mexican", "tacos"],
    icon: "🌮",
  },
  {
    id: "type-bbq-truck" as SightingTypeId,
    label: "BBQ Truck",
    categoryId: "cat-food-drink" as CategoryId,
    subcategoryId: "sub-food-trucks" as SubcategoryId,
    tags: ["food-truck", "bbq", "meat"],
  },
  {
    id: "type-ice-cream-truck" as SightingTypeId,
    label: "Ice Cream Truck",
    categoryId: "cat-food-drink" as CategoryId,
    subcategoryId: "sub-food-trucks" as SubcategoryId,
    tags: ["food-truck", "dessert", "ice-cream"],
    icon: "🍦",
  },
  {
    id: "type-happy-hour" as SightingTypeId,
    label: "Happy Hour Deal",
    categoryId: "cat-food-drink" as CategoryId,
    subcategoryId: "sub-restaurant-deals" as SubcategoryId,
    tags: ["discount", "drinks", "special"],
    icon: "🍹",
  },
  {
    id: "type-daily-special" as SightingTypeId,
    label: "Daily Special",
    categoryId: "cat-food-drink" as CategoryId,
    subcategoryId: "sub-restaurant-deals" as SubcategoryId,
    tags: ["discount", "food", "deal"],
  },
  {
    id: "type-new-restaurant" as SightingTypeId,
    label: "New Restaurant Opening",
    categoryId: "cat-food-drink" as CategoryId,
    subcategoryId: "sub-new-openings" as SubcategoryId,
    tags: ["new", "restaurant", "grand-opening"],
  },
  {
    id: "type-new-cafe" as SightingTypeId,
    label: "New Café Opening",
    categoryId: "cat-food-drink" as CategoryId,
    subcategoryId: "sub-new-openings" as SubcategoryId,
    tags: ["new", "coffee", "cafe"],
    icon: "☕",
  },
  {
    id: "type-free-samples" as SightingTypeId,
    label: "Free Food Samples",
    categoryId: "cat-food-drink" as CategoryId,
    subcategoryId: "sub-food-samples" as SubcategoryId,
    tags: ["free", "samples", "tasting"],
  },

  // Wildlife (15)
  {
    id: "type-deer" as SightingTypeId,
    label: "Deer",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-wild-animals" as SubcategoryId,
    tags: ["deer", "wildlife", "mammal"],
    icon: "🦌",
  },
  {
    id: "type-coyote" as SightingTypeId,
    label: "Coyote",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-wild-animals" as SubcategoryId,
    tags: ["coyote", "wildlife", "predator"],
  },
  {
    id: "type-raccoon" as SightingTypeId,
    label: "Raccoon",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-wild-animals" as SubcategoryId,
    tags: ["raccoon", "wildlife", "nocturnal"],
    icon: "🦝",
  },
  {
    id: "type-skunk" as SightingTypeId,
    label: "Skunk",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-wild-animals" as SubcategoryId,
    tags: ["skunk", "wildlife", "nocturnal"],
    icon: "🦨",
  },
  {
    id: "type-opossum" as SightingTypeId,
    label: "Opossum",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-wild-animals" as SubcategoryId,
    tags: ["opossum", "wildlife", "nocturnal"],
  },
  {
    id: "type-turkey" as SightingTypeId,
    label: "Wild Turkey",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-birds" as SubcategoryId,
    tags: ["turkey", "bird", "wildlife"],
    icon: "🦃",
  },
  {
    id: "type-hawk" as SightingTypeId,
    label: "Hawk",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-birds" as SubcategoryId,
    tags: ["hawk", "bird", "raptor"],
    icon: "🦅",
  },
  {
    id: "type-owl" as SightingTypeId,
    label: "Owl",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-birds" as SubcategoryId,
    tags: ["owl", "bird", "nocturnal"],
    icon: "🦉",
  },
  {
    id: "type-hummingbird" as SightingTypeId,
    label: "Hummingbird",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-birds" as SubcategoryId,
    tags: ["hummingbird", "bird", "small"],
  },
  {
    id: "type-snake" as SightingTypeId,
    label: "Snake",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-wild-animals" as SubcategoryId,
    tags: ["snake", "reptile", "wildlife"],
    icon: "🐍",
  },
  {
    id: "type-alligator" as SightingTypeId,
    label: "Alligator",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-marine-life" as SubcategoryId,
    tags: ["alligator", "reptile", "dangerous"],
    icon: "🐊",
  },
  {
    id: "type-turtle" as SightingTypeId,
    label: "Turtle",
    categoryId: "cat-wildlife" as CategoryId,
    subcategoryId: "sub-marine-life" as SubcategoryId,
    tags: ["turtle", "reptile", "wildlife"],
    icon: "🐢",
  },

  // Weather (10)
  {
    id: "type-tornado" as SightingTypeId,
    label: "Tornado",
    categoryId: "cat-weather" as CategoryId,
    subcategoryId: "sub-severe-weather" as SubcategoryId,
    tags: ["tornado", "severe", "dangerous"],
    icon: "🌪️",
  },
  {
    id: "type-funnel-cloud" as SightingTypeId,
    label: "Funnel Cloud",
    categoryId: "cat-weather" as CategoryId,
    subcategoryId: "sub-severe-weather" as SubcategoryId,
    tags: ["funnel", "severe", "tornado"],
  },
  {
    id: "type-hail" as SightingTypeId,
    label: "Hail",
    categoryId: "cat-weather" as CategoryId,
    subcategoryId: "sub-precipitation" as SubcategoryId,
    tags: ["hail", "storm", "damage"],
  },
  {
    id: "type-flooding" as SightingTypeId,
    label: "Flooding",
    categoryId: "cat-weather" as CategoryId,
    subcategoryId: "sub-precipitation" as SubcategoryId,
    tags: ["flood", "water", "dangerous"],
    icon: "🌊",
  },
  {
    id: "type-lightning" as SightingTypeId,
    label: "Lightning",
    categoryId: "cat-weather" as CategoryId,
    subcategoryId: "sub-atmospheric" as SubcategoryId,
    tags: ["lightning", "storm", "electrical"],
    icon: "⚡",
  },
  {
    id: "type-rainbow" as SightingTypeId,
    label: "Rainbow",
    categoryId: "cat-weather" as CategoryId,
    subcategoryId: "sub-atmospheric" as SubcategoryId,
    tags: ["rainbow", "weather", "beautiful"],
    icon: "🌈",
  },
  {
    id: "type-high-winds" as SightingTypeId,
    label: "High Winds",
    categoryId: "cat-weather" as CategoryId,
    subcategoryId: "sub-wind" as SubcategoryId,
    tags: ["wind", "damage", "dangerous"],
    icon: "💨",
  },

  // Infrastructure (8)
  {
    id: "type-pothole-repair" as SightingTypeId,
    label: "Pothole Repair",
    categoryId: "cat-infrastructure" as CategoryId,
    subcategoryId: "sub-road-work" as SubcategoryId,
    tags: ["road-work", "repair", "maintenance"],
    icon: "🚧",
  },
  {
    id: "type-street-paving" as SightingTypeId,
    label: "Street Paving",
    categoryId: "cat-infrastructure" as CategoryId,
    subcategoryId: "sub-road-work" as SubcategoryId,
    tags: ["paving", "construction", "road-work"],
  },
  {
    id: "type-power-outage" as SightingTypeId,
    label: "Power Outage",
    categoryId: "cat-infrastructure" as CategoryId,
    subcategoryId: "sub-service-disruption" as SubcategoryId,
    tags: ["power", "outage", "utility"],
    icon: "🔌",
  },
  {
    id: "type-water-main-break" as SightingTypeId,
    label: "Water Main Break",
    categoryId: "cat-infrastructure" as CategoryId,
    subcategoryId: "sub-utility-work" as SubcategoryId,
    tags: ["water", "utility", "emergency"],
    icon: "💧",
  },
  {
    id: "type-road-closure" as SightingTypeId,
    label: "Road Closure",
    categoryId: "cat-infrastructure" as CategoryId,
    subcategoryId: "sub-closures" as SubcategoryId,
    tags: ["closure", "road", "detour"],
    icon: "🚫",
  },
  {
    id: "type-bridge-closure" as SightingTypeId,
    label: "Bridge Closure",
    categoryId: "cat-infrastructure" as CategoryId,
    subcategoryId: "sub-closures" as SubcategoryId,
    tags: ["closure", "bridge", "detour"],
  },

  // Hazards (8)
  {
    id: "type-pothole" as SightingTypeId,
    label: "Pothole",
    categoryId: "cat-hazards" as CategoryId,
    subcategoryId: "sub-road-hazards" as SubcategoryId,
    tags: ["pothole", "road", "damage"],
    icon: "🕳️",
  },
  {
    id: "type-debris-in-road" as SightingTypeId,
    label: "Debris in Road",
    categoryId: "cat-hazards" as CategoryId,
    subcategoryId: "sub-road-hazards" as SubcategoryId,
    tags: ["debris", "road", "hazard"],
  },
  {
    id: "type-fallen-tree" as SightingTypeId,
    label: "Fallen Tree",
    categoryId: "cat-hazards" as CategoryId,
    subcategoryId: "sub-natural-hazards" as SubcategoryId,
    tags: ["tree", "storm-damage", "blocked"],
    icon: "🌳",
  },
  {
    id: "type-oil-spill" as SightingTypeId,
    label: "Oil Spill",
    categoryId: "cat-hazards" as CategoryId,
    subcategoryId: "sub-environmental-hazards" as SubcategoryId,
    tags: ["spill", "environmental", "slippery"],
  },
  {
    id: "type-broken-glass" as SightingTypeId,
    label: "Broken Glass",
    categoryId: "cat-hazards" as CategoryId,
    subcategoryId: "sub-road-hazards" as SubcategoryId,
    tags: ["glass", "hazard", "sharp"],
  },

  // Transportation (7)
  {
    id: "type-heavy-traffic" as SightingTypeId,
    label: "Heavy Traffic",
    categoryId: "cat-transportation" as CategoryId,
    subcategoryId: "sub-traffic-conditions" as SubcategoryId,
    tags: ["traffic", "congestion", "delay"],
    icon: "🚗",
  },
  {
    id: "type-vehicle-accident" as SightingTypeId,
    label: "Vehicle Accident",
    categoryId: "cat-transportation" as CategoryId,
    subcategoryId: "sub-accidents" as SubcategoryId,
    tags: ["accident", "crash", "emergency"],
    icon: "💥",
  },
  {
    id: "type-fender-bender" as SightingTypeId,
    label: "Fender Bender",
    categoryId: "cat-transportation" as CategoryId,
    subcategoryId: "sub-accidents" as SubcategoryId,
    tags: ["accident", "minor", "delay"],
  },
  {
    id: "type-parking-available" as SightingTypeId,
    label: "Parking Available",
    categoryId: "cat-transportation" as CategoryId,
    subcategoryId: "sub-parking" as SubcategoryId,
    tags: ["parking", "available", "spot"],
    icon: "🅿️",
  },
  {
    id: "type-bus-delay" as SightingTypeId,
    label: "Bus Delay",
    categoryId: "cat-transportation" as CategoryId,
    subcategoryId: "sub-public-transit" as SubcategoryId,
    tags: ["bus", "delay", "transit"],
    icon: "🚌",
  },

  // Market Activity (5)
  {
    id: "type-farmers-market" as SightingTypeId,
    label: "Farmers Market",
    categoryId: "cat-market-activity" as CategoryId,
    subcategoryId: "sub-farmers-markets" as SubcategoryId,
    tags: ["market", "produce", "local"],
    icon: "🥕",
  },
  {
    id: "type-craft-fair" as SightingTypeId,
    label: "Craft Fair",
    categoryId: "cat-market-activity" as CategoryId,
    subcategoryId: "sub-craft-fairs" as SubcategoryId,
    tags: ["crafts", "handmade", "market"],
    icon: "🎨",
  },
  {
    id: "type-flea-market" as SightingTypeId,
    label: "Flea Market",
    categoryId: "cat-market-activity" as CategoryId,
    subcategoryId: "sub-flea-markets" as SubcategoryId,
    tags: ["flea-market", "secondhand", "bargains"],
  },
  {
    id: "type-street-vendor" as SightingTypeId,
    label: "Street Vendor",
    categoryId: "cat-market-activity" as CategoryId,
    subcategoryId: "sub-vendor-popups" as SubcategoryId,
    tags: ["vendor", "street", "shopping"],
  },

  // Urban Finds (6)
  {
    id: "type-mural" as SightingTypeId,
    label: "Mural",
    categoryId: "cat-urban-finds" as CategoryId,
    subcategoryId: "sub-street-art" as SubcategoryId,
    tags: ["mural", "art", "street-art"],
    icon: "🎨",
  },
  {
    id: "type-graffiti-art" as SightingTypeId,
    label: "Graffiti Art",
    categoryId: "cat-urban-finds" as CategoryId,
    subcategoryId: "sub-street-art" as SubcategoryId,
    tags: ["graffiti", "art", "urban"],
  },
  {
    id: "type-scenic-view" as SightingTypeId,
    label: "Scenic View",
    categoryId: "cat-urban-finds" as CategoryId,
    subcategoryId: "sub-photo-ops" as SubcategoryId,
    tags: ["view", "photo", "scenic"],
    icon: "📷",
  },
  {
    id: "type-sculpture" as SightingTypeId,
    label: "Public Sculpture",
    categoryId: "cat-urban-finds" as CategoryId,
    subcategoryId: "sub-public-art" as SubcategoryId,
    tags: ["sculpture", "art", "public"],
  },
  {
    id: "type-urban-garden" as SightingTypeId,
    label: "Urban Garden",
    categoryId: "cat-urban-finds" as CategoryId,
    subcategoryId: "sub-urban-nature" as SubcategoryId,
    tags: ["garden", "nature", "green-space"],
    icon: "🌿",
  },

  // Automotive (7)
  {
    id: "type-ferrari" as SightingTypeId,
    label: "Ferrari",
    categoryId: "cat-automotive" as CategoryId,
    subcategoryId: "sub-exotic-cars" as SubcategoryId,
    tags: ["exotic", "luxury", "sports-car"],
    icon: "🏎️",
  },
  {
    id: "type-lamborghini" as SightingTypeId,
    label: "Lamborghini",
    categoryId: "cat-automotive" as CategoryId,
    subcategoryId: "sub-exotic-cars" as SubcategoryId,
    tags: ["exotic", "luxury", "sports-car"],
  },
  {
    id: "type-classic-mustang" as SightingTypeId,
    label: "Classic Mustang",
    categoryId: "cat-automotive" as CategoryId,
    subcategoryId: "sub-classic-cars" as SubcategoryId,
    tags: ["classic", "mustang", "vintage"],
    icon: "🚗",
  },
  {
    id: "type-vintage-corvette" as SightingTypeId,
    label: "Vintage Corvette",
    categoryId: "cat-automotive" as CategoryId,
    subcategoryId: "sub-classic-cars" as SubcategoryId,
    tags: ["classic", "corvette", "vintage"],
  },
  {
    id: "type-car-show" as SightingTypeId,
    label: "Car Show",
    categoryId: "cat-automotive" as CategoryId,
    subcategoryId: "sub-car-meetups" as SubcategoryId,
    tags: ["car-show", "meetup", "event"],
  },
  {
    id: "type-custom-car" as SightingTypeId,
    label: "Custom Car",
    categoryId: "cat-automotive" as CategoryId,
    subcategoryId: "sub-modified-vehicles" as SubcategoryId,
    tags: ["custom", "modified", "unique"],
  },

  // Civic Engagement (5)
  {
    id: "type-protest" as SightingTypeId,
    label: "Protest",
    categoryId: "cat-civic-engagement" as CategoryId,
    subcategoryId: "sub-protests" as SubcategoryId,
    tags: ["protest", "demonstration", "activism"],
    icon: "✊",
  },
  {
    id: "type-political-rally" as SightingTypeId,
    label: "Political Rally",
    categoryId: "cat-civic-engagement" as CategoryId,
    subcategoryId: "sub-rallies" as SubcategoryId,
    tags: ["rally", "politics", "campaign"],
    icon: "🎤",
  },
  {
    id: "type-town-hall" as SightingTypeId,
    label: "Town Hall Meeting",
    categoryId: "cat-civic-engagement" as CategoryId,
    subcategoryId: "sub-town-halls" as SubcategoryId,
    tags: ["town-hall", "meeting", "community"],
    icon: "🏛️",
  },
  {
    id: "type-petition-drive" as SightingTypeId,
    label: "Petition Drive",
    categoryId: "cat-civic-engagement" as CategoryId,
    subcategoryId: "sub-petitioning" as SubcategoryId,
    tags: ["petition", "signatures", "activism"],
  },
  {
    id: "type-voter-registration" as SightingTypeId,
    label: "Voter Registration",
    categoryId: "cat-civic-engagement" as CategoryId,
    subcategoryId: "sub-voter-activity" as SubcategoryId,
    tags: ["voting", "registration", "civic"],
    icon: "🗳️",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getCategoryById = (id: CategoryId): Category | undefined => {
  return categories.find((cat) => cat.id === id);
};

export const getSubcategoryById = (
  id: SubcategoryId
): Subcategory | undefined => {
  return subcategories.find((sub) => sub.id === id);
};

export const getSightingTypeById = (
  id: SightingTypeId
): SightingType | undefined => {
  return sightingTypes.find((type) => type.id === id);
};

export const getSubcategoriesByCategory = (
  categoryId: CategoryId
): Subcategory[] => {
  return subcategories.filter((sub) => sub.categoryId === categoryId);
};

export const getSightingTypesByCategory = (
  categoryId: CategoryId
): SightingType[] => {
  return sightingTypes.filter((type) => type.categoryId === categoryId);
};

export const getSightingTypesBySubcategory = (
  subcategoryId: SubcategoryId
): SightingType[] => {
  return sightingTypes.filter((type) => type.subcategoryId === subcategoryId);
};

export const getSightingTypesByTag = (tag: string): SightingType[] => {
  return sightingTypes.filter((type) => type.tags.includes(tag));
};

export const getAllTags = (): string[] => {
  const tagSet = new Set<string>();
  sightingTypes.forEach((type) => {
    type.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
};

// ============================================================================
// STATISTICS
// ============================================================================

export const taxonomyStats = {
  totalCategories: categories.length,
  totalSubcategories: subcategories.length,
  totalSightingTypes: sightingTypes.length,
  totalTags: getAllTags().length,
  subcategoriesPerCategory: categories.map((cat) => ({
    category: cat.label,
    count: getSubcategoriesByCategory(cat.id).length,
  })),
  typesPerCategory: categories.map((cat) => ({
    category: cat.label,
    count: getSightingTypesByCategory(cat.id).length,
  })),
};
