import { Elysia, t } from "elysia";

async function tryGeocodeXyz(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://geocode.xyz/${lat},${lon}?json=1`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    if (data.error || typeof data === 'string') return null;

    const streetNumber = data.stnumber || data.standard?.stnumber;
    const streetName = data.staddress || data.standard?.addresst;
    
    const isValid = (str: any): str is string => {
      return typeof str === 'string' && 
             str.length > 0 && 
             !str.includes('Throttled') &&
             !str.includes('PO Box')
    }
    
    if (!isValid(streetNumber) || !isValid(streetName)) return null;
    
    return `${streetNumber} ${streetName}`;
  } catch {
    return null;
  }
}

async function tryNominatim(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'DigitalMenuApp/1.0'
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.address) return null;

    const addr = data.address;
    
    const hasStreet = addr.road || addr.pedestrian;
    if (!hasStreet) return null;
    
    const addressParts = [];
    if (addr.house_number) addressParts.push(addr.house_number);
    if (addr.road) addressParts.push(addr.road);
    else if (addr.pedestrian) addressParts.push(addr.pedestrian);
    
    return addressParts.length > 0 ? addressParts.join(" ") : null;
  } catch {
    return null;
  }
}

async function tryBigDataCloud(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    if (!data.localityInfo?.administrative?.[4]?.name) return null;
    
    const streetInfo = data.localityInfo.administrative[4].name;
    
    if (streetInfo.toLowerCase().includes('street') || 
        streetInfo.toLowerCase().includes('avenue') ||
        streetInfo.toLowerCase().includes('road') ||
        streetInfo.toLowerCase().includes('boulevard') ||
        streetInfo.toLowerCase().includes('calle') ||
        streetInfo.toLowerCase().includes('avenida')) {
      return streetInfo;
    }
    
    return null;
  } catch {
    return null;
  }
}

export const geocodingPlugin = new Elysia({ prefix: "/api/geocoding" })
  .get(
    "/reverse",
    async ({ query }) => {
      const { lat, lon } = query;

      let address = await tryGeocodeXyz(lat, lon);
      let source = "geocode.xyz";

      if (!address) {
        address = await tryNominatim(lat, lon);
        source = "nominatim";
      }

      if (!address) {
        address = await tryBigDataCloud(lat, lon);
        source = "bigdatacloud";
      }

      if (!address) {
        return {
          success: false,
          address: null,
          latitude: lat,
          longitude: lon,
          message: "Could not determine address. Please enter manually."
        };
      }

      return {
        success: true,
        address,
        latitude: lat,
        longitude: lon,
        source
      };
    },
    {
      query: t.Object({
        lat: t.Numeric(),
        lon: t.Numeric(),
      }),
    }
  );
