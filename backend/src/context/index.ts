import Elysia from "elysia";
import { drizzleDb } from "@backend/lib/db";
import { cors } from "@elysiajs/cors";
import jwt from "@backend/jwt";
import { bearer } from "@elysiajs/bearer";
import { CacheControlService } from "@backend/modules/cache_control/service";

const cacheControlService = new CacheControlService(drizzleDb);

// await cacheControlService.init();

console.log('cacheService initialized');

export const ctx = new Elysia({
  name: "@app/ctx",
})
  .decorate("drizzle", drizzleDb)
  .decorate("cacheController", cacheControlService)
  .use(
    // @ts-ignore
    cors({
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  )
  // @ts-ignore
  .use(bearer())
  // @ts-ignore
  .use(jwt)
  .derive(
    { as: "global" },
    async ({
      // @ts-ignore
      bearer,
      cacheController,
    }) => {
      const token = bearer;
      if (!token) {
        return {
          user: null,
        };
      }

      try {
        if (token == process.env.API_TOKEN) {
          return {
            user: null,
          };
        }

        const res = await cacheController.getCachedUserDataByToken(token);

        return {
          user: res,
        };
      } catch (error) {
        console.log("error", error);
        return {
          user: null,
        };
      }
    }
  );
