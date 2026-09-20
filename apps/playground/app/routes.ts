import { get, route } from "remix/routes"

export const routes = route({
  home: get("/"),
  component: get("/c/:component"),
  dashboard: get("/pages/dashboard"),
  spa: get("/spa(/*path)"),
  assets: get("/assets/*path"),
})
