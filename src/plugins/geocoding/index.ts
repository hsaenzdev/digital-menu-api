import { Elysia, t } from "elysia";

export const geocodingPlugin = new Elysia({ prefix: "/api/geocoding" })
  .get(
    "/reverse",
    async ({ query, set }) => {
      const { lat, lon } = query;

      try {
        // Using geocode.xyz for reverse geocoding
        // Free tier: 1 req/sec throttled for unauthenticated users
        const response = await fetch(
          `https://geocode.xyz/${lat},${lon}?json=1`
        );

        if (!response.ok) {
          set.status = response.status;
          return {
            error: "Failed to fetch address from geocoding service",
          };
        }

        const data = await response.json();

        // Check for errors
        if (data.error) {
          set.status = 400;
          return {
            error: data.error.description || "Geocoding failed",
            suggestion: data.suggestion,
          };
        }

        // Build address from geocode.xyz response
        // geocode.xyz returns data in two possible formats:
        // 1. data.stnumber, data.staddress, data.city, etc
        // 2. data.standard.stnumber, data.standard.addresst, data.standard.city, etc
        const addressParts = [];
        
        // Street number and name
        const streetNumber = data.stnumber || data.standard?.stnumber;
        const streetName = data.staddress || data.standard?.addresst;
        
        if (streetNumber) addressParts.push(streetNumber);
        if (streetName) addressParts.push(streetName);
        
        // City
        const city = data.city || data.standard?.city;
        if (city) addressParts.push(city);
        
        // State/Province
        const state = data.prov || data.standard?.prov;
        if (state) addressParts.push(state);
        
        // Postal code
        const postal = data.postal || data.standard?.postal;
        if (postal) addressParts.push(postal);
        
        // Country
        const country = data.countryname || data.standard?.countryname;

        const fullAddress = addressParts.join(", ");

        return {
          address: fullAddress || null,
          street_number: streetNumber || null,
          street_name: streetName || null,
          city: city || null,
          state: state || null,
          postal_code: postal || null,
          country: country || null,
          confidence: data.confidence || data.standard?.confidence || null,
          raw: data,
        };
      } catch (error) {
        console.error('Geocoding error:', error);
        set.status = 500;
        return {
          error: "Internal server error during geocoding",
        };
      }
    },
    {
      query: t.Object({
        lat: t.Numeric(),
        lon: t.Numeric(),
      }),
    }
  );
