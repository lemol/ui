import { get, route } from "remix/routes"

export const routes = route({
  home: get("/"),
  component: get("/c/:component"),
  assets: get("/assets/*path"),
})
