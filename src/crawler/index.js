'use strict'

const rp = require('request-promise')
const cheerio = require('cheerio')
const Promise = require('bluebird')
const db = require('../db')

const debug = false
const sep = '==========================='

const visitedPages = {}
// const retryDelayMin = 1000
// const retryDelayMax = 3000
const reqDelayMin = 500
const reqDelayMax = 1500
const maxAttempts = 2
const maxDepth = 2

function getPageLinks (baseURL, pageToVisit, parentUrl = null, depth = 0, attempt = 0) {
  if (depth > maxDepth || attempt > maxAttempts) {
    return Promise.resolve(false)
  }
  if (debug) {
    console.log(sep)
    console.log(`Visiting page ${pageToVisit}`)
    console.log(`Maxdepth=${maxDepth}, Depth=${depth}`)
  }
  const options = {
    uri: pageToVisit,
    resolveWithFullResponse: true,
  }
  return Promise
    .delay(Math.random() * (reqDelayMax - reqDelayMin) + reqDelayMin)
    .then(() => rp(options))
    .then(response => {
      const $ = cheerio.load(response.body)
      const title = $('title').text()
      const body = $('body').text()
      db.addNode({
        parentUrl: parentUrl,
        title: title,
        url: pageToVisit,
        body: body,
      })
      visitedPages[pageToVisit] = true
      $('a[href^="/"]').each(function () {
        const outlink = `${baseURL}${$(this).attr('href')}`
        if (outlink in visitedPages) {
          if (outlink !== pageToVisit) {
            db.addConnection(pageToVisit, outlink)
          }
          return
        }
        getPageLinks(baseURL, outlink, pageToVisit, depth + 1)
      })
      return Promise.resolve(pageToVisit)
    })
    .catch(err => {
      // if (err.respose === undefined) {
      //   console.log(`[S${attempt}]: ${pageToVisit}`)
      //   setTimeout(
      //     () => getPageLinks(baseURL, pageToVisit, depth, attempt + 1),
      //     Math.random() * (retryDelayMax - retryDelayMin) + retryDelayMin
      //   )
      //   return
      // }
      // console.error(err)
    })
}

function loadVisitedPages (callback) {
  db.query('MATCH (n:Page) RETURN n.title AS title', results => {
    results.forEach(result => {
      visitedPages[result.title] = true
    })
    callback()
  })
}

module.exports = function main () {
  const baseURL = 'https://cs.wikipedia.org'
  const pageToVisit = 'https://cs.wikipedia.org/wiki/Hlavn%C3%AD_strana'
  // loadVisitedPages(() => {
  return getPageLinks(baseURL, pageToVisit)
  // })
}
