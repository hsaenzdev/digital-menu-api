import { Elysia } from "elysia";
import { healthRoutes } from "./plugins/health";
import { menuPlugin } from "./plugins/menu";
import { menuManagerPlugin } from "./plugins/menu-manager";
import { orderPlugin } from "./plugins/orders";
import { ordersManagerPlugin } from "./plugins/orders-manager";
import { customerPlugin } from "./plugins/customers";
import { customerLocationsPlugin } from "./plugins/customer-locations";
import { geofencingPlugin } from "./plugins/geofencing";
import { zonesManagerPlugin } from "./plugins/zones-manager";
import { settingsPlugin } from "./plugins/settings";
import { staffPlugin } from "./plugins/staff";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { staticPlugin } from "@elysiajs/static";
import { PORT } from "./config/env";

const app = new Elysia()
  .use(
    staticPlugin({
      assets: "public",
      prefix: "/",
    })
  )
  .use(serverTiming())
  .use(cors())
  .use(healthRoutes)
  .use(menuPlugin)
  .use(menuManagerPlugin)
  .use(orderPlugin)
  .use(ordersManagerPlugin)
  .use(customerPlugin)
  .use(customerLocationsPlugin)
  .use(geofencingPlugin)
  .use(zonesManagerPlugin)
  .use(settingsPlugin)
  .use(staffPlugin)
  .listen(PORT);

console.log(
  `🦊 Server is running at "http://${app.server?.hostname}:${app.server?.port}"`
);
