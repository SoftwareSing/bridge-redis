# bridge-redis

An implement of [cache-bridge](https://www.npmjs.com/package/cache-bridge)'s CacheClient

## Installation

```sh
npm install redis cache-bridge bridge-redis
```

## Example

```js
const redis = require('redis')
const cacheBridge = require('cache-bridge')
const RedisCacheClient = require('bridge-redis')(cacheBridge.CacheClient)
const YourDB = require('./YourDB')

const redisClient = redis.createClient()

const redisCacheClient = new RedisCacheClient({ client: redisClient })
const { bridge } = cacheBridge({
  cacheClient: redisCacheClient,
  prefix: 'cache-a',
  ttl: 5 * 1000,
  get: async function (id) {
    return await YourDB.findOne(id)
  },
  getMany: async function (idList) {
    return await YourDB.find(idList)
  }
})

async function consoleData (id) {
  const data = await bridge.get(id)
  console.log(data)
}
const id = 'idA'
// even many functions execute at the same time, only the first one will call YourDB, others will wait and get data from cache
consoleData(id)
consoleData(id)
consoleData(id)
consoleData(id)
consoleData(id)
```
