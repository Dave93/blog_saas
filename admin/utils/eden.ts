import { treaty, edenFetch } from "@elysiajs/eden";
import type { App } from "@backend/index";

console.log("process.env.APP_API_URL from eden", process.env.APP_API_URL);
export const apiClient = treaty<App>(process.env.APP_API_URL!);
export const apiFetch = edenFetch<App>(process.env.APP_API_URL!);
