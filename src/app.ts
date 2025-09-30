import { Elysia } from "elysia";
import { healthRoutes } from "./plugins/health";
import { menuPlugin } from "./plugins/menu";
import { orderPlugin } from "./plugins/orders";
import { customerPlugin } from "./plugins/customers";
import { adminPlugin } from "./plugins/admin";
import { cors } from "@elysiajs/cors";
import { bearer } from "@elysiajs/bearer";
import { serverTiming } from "@elysiajs/server-timing";
import { staticPlugin } from "@elysiajs/static";
import { PORT } from "./config/env";
import { openapi } from "@elysiajs/openapi";

const app = new Elysia()
  .use(
    staticPlugin({
      assets: "public",
      prefix: "/",
    })
  )
  .use(serverTiming())
  .use(cors())
  .use(bearer())
  .use(openapi())
  .use(healthRoutes)
  .use(menuPlugin)
  .use(orderPlugin)
  .use(customerPlugin)
  .use(adminPlugin)
  .listen(PORT);

console.log(
  `🦊 Server is running at "http://${app.server?.hostname}:${app.server?.port}"`
);
