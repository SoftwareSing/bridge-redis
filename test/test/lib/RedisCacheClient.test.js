const faker = require('faker')
const { expect } = require('chai')
const { CacheClient } = require('cache-bridge')
const { sleep } = require('cache-bridge/lib/sleep')

const RedisCacheClient = require('../../../lib/getRedisCacheClient')(CacheClient)
const { client } = require('../../test-utils/redisClient')

describe('RedisCacheClient', function () {
  let redisCacheClient = new RedisCacheClient({ client })
  let ttl = 10

  beforeEach(function () {
    redisCacheClient = new RedisCacheClient({ client })
    ttl = faker.datatype.number({ min: 1000, max: 10000 })
  })

  describe('get(), set(), del(), setNotExist()', function () {
    let key = ''
    let text = ''

    beforeEach(function () {
      key = faker.datatype.uuid()
      text = faker.lorem.paragraphs()
    })

    it('should return undefined if cache missing', async function () {
      const result = await redisCacheClient.get(key)
      expect(result).to.equal(undefined)
    })

    it('should success set cache and then get cache data', async function () {
      const setResult = await redisCacheClient.set(key, text, ttl)
      expect(setResult).to.equal(undefined)

      const getResult = await redisCacheClient.get(key)
      expect(getResult).to.equal(text)
    })

    it('ttl should work with set()', async function () {
      ttl = faker.datatype.number({ min: 15, max: 30 })
      await redisCacheClient.set(key, text, ttl)

      const beforeExpireResult = await redisCacheClient.get(key)
      expect(beforeExpireResult).to.equal(text)

      await sleep(ttl + 5)
      const afterExpireResult = await redisCacheClient.get(key)
      expect(afterExpireResult).to.equal(undefined)
    })

    it('should success set cache by setNotExist()', async function () {
      const setResult = await redisCacheClient.setNotExist(key, text, ttl)
      expect(setResult).to.equal(true)

      const getResult = await redisCacheClient.get(key)
      expect(getResult).to.equal(text)
    })

    it('should not set cache if use setNotExist() to set a exist cache', async function () {
      const existText = faker.lorem.paragraphs()
      await redisCacheClient.set(key, existText, ttl)

      const setResult = await redisCacheClient.setNotExist(key, text, ttl)
      expect(setResult).to.equal(false)

      const getResult = await redisCacheClient.get(key)
      expect(getResult).to.equal(existText)
    })

    it('ttl should work with setNotExist()', async function () {
      ttl = faker.datatype.number({ min: 15, max: 30 })
      await redisCacheClient.setNotExist(key, text, ttl)

      const beforeExpireResult = await redisCacheClient.get(key)
      expect(beforeExpireResult).to.equal(text)

      await sleep(ttl + 5)
      const afterExpireResult = await redisCacheClient.get(key)
      expect(afterExpireResult).to.equal(undefined)
    })

    it('should cache miss after del()', async function () {
      await redisCacheClient.set(key, text, ttl)
      const beforeDelResult = await redisCacheClient.get(key)
      expect(beforeDelResult).to.equal(text)

      const delResult = await redisCacheClient.del(key)
      expect(delResult).to.equal(undefined)

      const afterDelResult = await redisCacheClient.get(key)
      expect(afterDelResult).to.equal(undefined)
    })
  })

  describe('getMany(), setMany(), delMany()', function () {
    let keyTextMap = new Map([['key', 'text']])

    beforeEach(function () {
      const size = faker.datatype.number({ min: 1, max: 100 })
      keyTextMap = new Map()
      for (let i = 0; i < size; i += 1) {
        const key = faker.random.alphaNumeric(i + 1)
        const text = faker.lorem.paragraphs()
        keyTextMap.set(key, text)
      }
    })

    it('should success set cache and then get data', async function () {
      const setResult = await redisCacheClient.setMany(new Map(keyTextMap.entries()), ttl)
      expect(setResult).to.equal(undefined)

      const getResult = await redisCacheClient.getMany([...keyTextMap.keys()])
      let resultCount = 0
      for (const [key, text] of getResult) {
        expect(keyTextMap.has(key)).to.equal(true)
        expect(text).to.equal(keyTextMap.get(key))
        resultCount += 1
      }
      expect(resultCount).to.equal(keyTextMap.size)
    })

    it('should return undefined if cache miss', async function () {
      await redisCacheClient.setMany(new Map(keyTextMap.entries()), ttl)
      const missKeyList = (new Array(faker.datatype.number({ min: 1, max: 10 })))
        .fill()
        .map(faker.datatype.uuid)

      const getResult = await redisCacheClient.getMany([...keyTextMap.keys(), ...missKeyList])
      const resultMap = new Map(getResult)
      for (const [key, expectText] of keyTextMap.entries()) {
        const text = resultMap.get(key)
        expect(text).to.equal(expectText)
      }
      for (const key of missKeyList) {
        expect(resultMap.has(key)).to.equal(true)
        const text = resultMap.get(key)
        expect(text).to.equal(undefined)
      }
    })

    it('ttl should work with setMany()', async function () {
      ttl = faker.datatype.number({ min: 15, max: 30 })
      await redisCacheClient.setMany(new Map(keyTextMap.entries()), ttl)

      const beforeExpireResult = await redisCacheClient.getMany([...keyTextMap.keys()])
      for (const [key, text] of beforeExpireResult) {
        expect(text).to.equal(keyTextMap.get(key))
      }

      await sleep(ttl + 5)
      const afterExpireResult = await redisCacheClient.getMany([...keyTextMap.keys()])
      for (const [, text] of afterExpireResult) {
        expect(text).to.equal(undefined)
      }
    })

    it('should cache miss after delMany()', async function () {
      await redisCacheClient.setMany(new Map(keyTextMap.entries()), ttl)

      const beforeDelResult = await redisCacheClient.getMany([...keyTextMap.keys()])
      for (const [key, text] of beforeDelResult) {
        expect(text).to.equal(keyTextMap.get(key))
      }

      const delResult = await redisCacheClient.delMany([...keyTextMap.keys()])
      expect(delResult).to.equal(undefined)

      const afterDelResult = await redisCacheClient.getMany([...keyTextMap.keys()])
      for (const [, text] of afterDelResult) {
        expect(text).to.equal(undefined)
      }
    })
  })

  describe('getMany()', function () {
    it('should return empty array if keyList is an empty array', async function () {
      const result = await redisCacheClient.getMany([])
      expect(result).to.deep.equal([])
    })
  })

  describe('setMany()', function () {
    it('should return a resolved promise if there is nothing to set', async function () {
      const result = await redisCacheClient.setMany(new Map(), ttl)
      expect(result).to.equal(undefined)
    })
  })

  describe('delMany()', function () {
    it('should return a resolved promise even keyList is an empty array', async function () {
      const result = await redisCacheClient.delMany([])
      expect(result).to.equal(undefined)
    })
  })
})
