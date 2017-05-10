'use strict'

const request = require('request')
const cheerio = require('cheerio')
const _ = require('lodash')

const debug = true
const sep = '==========================='

function getPageLinks (baseURL, pageToVisit, limit = 3, depth = 0) {
  if (depth > limit) {
    return
  }
  if (debug) {
    console.log(sep)
    console.log(`Visiting page ${pageToVisit}`)
    console.log(`Limit=${limit}, Depth=${depth}`)
  }
  request(pageToVisit, (error, response, body) => {
    if (error) {
      console.error(error)
      return
    }
    // Check status code (200 is HTTP OK)
    if (debug) {
      console.log(`Status code: ${response.statusCode}`)
      console.log(sep)
    }
    if (response.statusCode === 200) {
      // Parse the document body
      const dom = cheerio.load(body)
      dom('a[href^="http"]').each(function () {
        const link = dom(this).attr('href')
        if (link.startsWith(baseURL)) {
          if (debug) {
            console.log('Skipping..')
          }
          return
        }
        if (debug) {
          let tab = ''
          for (let i = 0; i < depth; i++) {
            tab += '\t'
          }
          console.log(`${tab}${pageToVisit} => ${link}`)
        }
        getPageLinks(baseURL, link, limit, depth + 1)
      })
    }
  })
}

module.exports = function main () {
  const baseURL = 'https://cs.wikipedia.org/'
  getPageLinks(baseURL, baseURL)
}
