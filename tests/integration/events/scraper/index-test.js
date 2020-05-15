process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../utils.js')
const testCache = require('../../_lib/testcache.js')


test('scrape extracts data from cached file', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('fake/fake.json', { cases: 10, deaths: 20 })
  await utils.crawl('fake')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  const fullResult = await utils.scrape('fake')
  const result = fullResult[0]
  t.ok(result, 'Have result')

  t.equal('iso1:us#iso2:us-ca', result.locationIDs.join(), 'Location IDs')

  const actual = result.data
  t.ok(actual, 'Have data')
  t.equal(1, actual.length, '1 record in returned data')

  // These fields should match exactly.
  // TODO (testing) Add extra fields here so we're sure nothing is lost.
  const expected = {
    cases: 10,
    deaths: 20,
    country:
    'iso1:US',
    state: 'iso2:US-CA',
    locationID: 'iso1:us#iso2:us-ca',
    source: 'fake',
    priority: 0
  }
  const prunedActual = Object.keys(expected).reduce((hsh, key) => {
    hsh[key] = actual[0][key]
    return hsh
  }, {})
  t.deepEqual(expected, prunedActual, 'exact key matches')

  // Don't check content of these fields, just ensure that they exist and match pattern.
  const dateFields = [ 'dateSource', 'date', 'updated' ]
  dateFields.forEach(f => {
    const dateRe = /^\d\d\d\d-\d\d-\d\d/
    t.ok(actual[0][f].match(dateRe), `${f} matches ${dateRe}`)
  })

  await utils.teardown()
  t.end()
})