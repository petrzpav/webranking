'use strict'

const rp = require('request-promise')
const cheerio = require('cheerio')
const db = require('../db')

const debug = false
const sep = '==========================='

const visitedPages = {}
const limit = 1

function getPageLinks (baseURL, pageToVisit, depth = 0) {
  if (depth > limit) {
    return Promise.resolve()
  }
  if (debug) {
    console.log(sep)
    console.log(`Visiting page ${pageToVisit}`)
    console.log(`Limit=${limit}, Depth=${depth}`)
  }
  const options = {
    uri: pageToVisit,
    transform: cheerio.load,
  }
  return rp(options)
    .then($ => {
      $('a[href^="http"]').each(function () {
        const outlink = $(this).attr('href')
        if (!outlink.startsWith(baseURL)) {
          if (debug) {
            console.log('Skipping..')
          }
          return
        }
        const childRequest = processLink(baseURL, outlink, pageToVisit, depth)
        if (!childRequest) {
          db.addNode(outlink)
          return
        }
        db.addConnection(pageToVisit, outlink)
      })
    })
    .catch(err => {
      console.error(err)
    })
}

function processLink (baseURL, link, pageToVisit, depth) {
  if (link in visitedPages) {
    return false
  }
  if (debug) {
    console.log(`${depth}: ${pageToVisit} => ${link}`)
  }
  visitedPages[link] = true
  return getPageLinks(baseURL, link, depth + 1)
}

module.exports = function main () {
  const baseURL = 'https://cs.wikipedia.org/'
  getPageLinks('https', baseURL)
}
