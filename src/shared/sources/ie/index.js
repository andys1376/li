const assert = require('assert')
const datetime = require('../../datetime/index.js')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const parse = require('../_lib/parse.js')

const country = 'iso1:IE'

module.exports = {
  aggregate: 'state',
  country,
  timeseries: true,
  friendly: {
    name: 'Ireland Open Data Portal',
    url: 'https://data.gov.ie/',
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-27',
      crawl: [
        {
          type: 'csv',
          url: 'http://opendata-geohive.hub.arcgis.com/datasets/d9be85b30d7748b5b7c09450b8aede63_0.csv?outSR={"latestWkid":3857,"wkid":102100}'
        }
      ],
      scrape ($, date, { getIso2FromName }) {
        const getIso2IE = (name) => {
          const isoOverrides = { // Non-unique gets mapped straight to ISO2
            'Meath': 'iso2:IE-MH',
          }
          return isoOverrides[name] || getIso2FromName({ country, name })
        }

        const casesByRegion = {}

        for (const item of $) {
          const itemDate = datetime.parse(item['﻿TimeStamp'].replace(/\//g, '-'))
          if (itemDate === date) {
            casesByRegion[item.CountyName] = parse.number(item.ConfirmedCovidCases)
          }
        }

        const states = []
        for (const stateName of Object.keys(casesByRegion)) {
          states.push({
            state: getIso2IE(stateName),
            cases: casesByRegion[stateName]
          })
        }

        const summedData = transform.sumData(states)
        states.push(summedData)

        assert(summedData.cases > 0, 'Cases are not reasonable for date: ' + date)
        return states
      }
    }
  ]
}
