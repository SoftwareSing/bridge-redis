const { promisify } = require('util')

const REDIS = Symbol('redis')
const CACHE_MISSING_RETURN = Symbol('cacheMissingReturn')
const GET = Symbol('get')
const MGET = Symbol('mget')
const DEL = Symbol('del')
const SET = Symbol('set')

/**
 * @typedef {import('cache-bridge').CacheClient} CacheClient
 * @typedef {import('redis').RedisClient} RedisClient
 */

/**
 * @param {CacheClient} cacheClient
 */
module.exports = function (cacheClient) {
  return class RedisCacheClient extends cacheClient {
    /**
     * @param {Object} options
     * @param {RedisClient} options.client
     * @param {Any} options.cacheMissingReturn
     */
    constructor ({ client, cacheMissingReturn = null }) {
      super()
      this[REDIS] = client
      this[CACHE_MISSING_RETURN] = cacheMissingReturn
      this[GET] = promisify(client.get).bind(client)
      this[MGET] = promisify(client.mget).bind(client)
      this[DEL] = promisify(client.del).bind(client)
      this[SET] = promisify(client.set).bind(client)
    }

    /**
     * @param {String} key
     * @returns {Promise<String>}
     */
    async get (key) {
      const result = await this[GET](key)
      return result !== this[CACHE_MISSING_RETURN] ? result : undefined
    }

    /**
     * @param {Array<String>} keyList
     * @returns {Promise<Iterable<[String, String]>>} [ [key, value], [key, value], [key, value] ]
     */
    async getMany (keyList) {
      const valueList = await this[MGET](keyList)
      const cacheMissingReturn = this[CACHE_MISSING_RETURN]
      const result = new Array(keyList.length)
      for (let i = 0; i < result.length; i += 1) {
        const value = valueList[i]
        result[i] = [
          keyList[i],
          value !== cacheMissingReturn ? value : undefined
        ]
      }
      return result
    }

    /**
     * @param {String} key
     */
    async del (key) {
      await this[DEL](key)
    }

    /**
     * @param {Array<String>} keyList
     */
    async delMany (keyList) {
      await this[DEL](keyList)
    }

    /**
     * @param {String} key
     * @param {String} text stringify data
     * @param {Number} ttl expire time, in milliseconds.
     */
    async set (key, text, ttl) {
      await this[SET](key, text, 'PX', ttl)
    }

    /**
     * @param {Map<String, String>} keyTextMap Map<'key', 'stringify data'>
     * @param {Number} ttl expire time, in milliseconds.
     */
    setMany (keyTextMap, ttl) {
      const multi = this[REDIS].multi()
      for (const [key, text] of keyTextMap.entries()) {
        multi.set(key, text, 'PX', ttl)
      }
      return new Promise((resolve, reject) => {
        multi.exec((err) => err ? reject(err) : resolve())
      })
    }

    /**
     * @param {String} key
     * @param {String} text stringify data
     * @param {Number} ttl expire time, in milliseconds.
     * @returns {Promise<Boolean>} return true if success set key, otherwise return false
     */
    async setNotExist (key, text, ttl) {
      const result = await this[SET](key, text, 'PX', ttl, 'NX')
      return result !== this[CACHE_MISSING_RETURN]
    }
  }
}
