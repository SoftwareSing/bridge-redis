# bridge-redis

An implement of [cache-bridge](https://www.npmjs.com/package/cache-bridge)'s CacheClient

## Installation

```sh
npm install redis cache-bridge bridge-redis
```

## Example

```js
const redis = require('redis')
const { CacheClient, Cache } = require('cache-bridge')
const RedisCacheClient = require('bridge-redis')(CacheClient)

const redisClient = redis.createClient()

const redisCacheClient = new RedisCacheClient({ client: redisClient })
const cache = new Cache(redisCacheClient, {
  prefix: 'prefix-string',
  ttl: 60 * 1000
})
```
