import { Elysia } from "elysia";
import { healthRoutes } from "./plugins/health";
import { menuPlugin } from "./plugins/menu";
import { orderPlugin } from "./plugins/orders";
import { customerPlugin } from "./plugins/customers";
import { adminPlugin } from "./plugins/admin";
import { whatsappPlugin } from "./plugins/whatsapp";
import { geocodingPlugin } from "./plugins/geocoding";
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
  .use(orderPlugin)
  .use(customerPlugin)
  .use(adminPlugin)
  .use(whatsappPlugin)
  .use(geocodingPlugin)
  .listen(PORT);

console.log(
  `🦊 Server is running at "http://${app.server?.hostname}:${app.server?.port}"`
);
