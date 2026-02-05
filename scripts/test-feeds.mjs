import { USGSEarthquakeFeed } from "../src/adapters/feeds/usgs-earthquake-feed.js";
import { NOAAWeatherFeed } from "../src/adapters/feeds/noaa-weather-feed.js";

async function testFeeds() {
  console.log("Testing USGS Earthquake Feed...\n");

  try {
    const usgs = new USGSEarthquakeFeed();
    const earthquakes = await usgs.fetch({ limit: 5 });

    console.log(`Found ${earthquakes.length} earthquakes:\n`);
    earthquakes.forEach((eq, i) => {
      console.log(`${i + 1}. ${eq.title}`);
      console.log(`   Location: ${eq.location.lat}, ${eq.location.lng}`);
      console.log(`   Severity: ${eq.severity}`);
      console.log(`   Type ID: ${eq.typeId}`);
      console.log(`   Description length: ${eq.description?.length || 0} chars`);
      console.log(`   External ID: ${eq.externalId}`);
      console.log();
    });
  } catch (error) {
    console.error("USGS Feed Error:", error.message);
  }

  console.log("\n" + "=".repeat(80) + "\n");
  console.log("Testing NOAA Weather Feed...\n");

  try {
    const noaa = new NOAAWeatherFeed();
    const alerts = await noaa.fetch({ limit: 5 });

    console.log(`Found ${alerts.length} weather alerts:\n`);
    alerts.forEach((alert, i) => {
      console.log(`${i + 1}. ${alert.title}`);
      console.log(`   Location: ${alert.location.lat}, ${alert.location.lng}`);
      console.log(`   Severity: ${alert.severity}`);
      console.log(`   Type ID: ${alert.typeId}`);
      console.log(`   Description length: ${alert.description?.length || 0} chars`);
      console.log(`   External ID: ${alert.externalId}`);
      console.log();
    });
  } catch (error) {
    console.error("NOAA Feed Error:", error.message);
  }
}

testFeeds();
