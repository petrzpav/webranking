'use strict'

const rp = require('request-promise')
const cheerio = require('cheerio')
const db = require('../db')

const debug = false
const sep = '==========================='

const visitedPages = {}
const limit = 2

function getPageLinks (baseURL, pageToVisit, depth = 0) {
  if (depth > limit) {
    return false
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
      const title = $('title').text()
      const body = $('body').text()
      db.addNode({
        title: title,
        url: pageToVisit,
        body: body,
      })
      $('a[href^="/"]').each(function () {
        const outlink = `${baseURL}${$(this).attr('href')}`
        const childRequest = processLink(baseURL, outlink, pageToVisit, depth)
        if (!childRequest) {
          return
        }
        childRequest
          .then((dest) => {
            if (!dest) {
              return
            }
            db.addConnection(pageToVisit, dest)
          })
      })
      return pageToVisit
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
  const baseURL = 'https://cs.wikipedia.org'
  // getPageLinks(/^https:\/\/[^.]+\.wikipedia\.org/, baseURL)
  getPageLinks(baseURL, baseURL)
}
