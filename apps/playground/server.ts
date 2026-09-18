import { createPlaygroundRouter } from "./app/router.ts"

const router = createPlaygroundRouter()

const server = Bun.serve({
  port: Number(process.env.PORT) || 4000,
  fetch(request) {
    return router.fetch(request)
  },
})

console.log(`Playground running at http://localhost:${server.port}`)
