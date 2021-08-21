const { promisify } = require('util')
const { client } = require('../test-utils/redisClient')

const flushallAsync = promisify(client.flushall).bind(client)

beforeEach(async function () {
  await flushallAsync()
})

after(async function () {
  const quitAsync = promisify(client.quit).bind(client)
  await quitAsync()
})
