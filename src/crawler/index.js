'use strict'

const rp = require('request-promise')
const cheerio = require('cheerio')
const db = require('../db')

const debug = false
const sep = '==========================='

const visitedPages = {}
const retryDelayMin = 1000
const retryDelayMax = 3000
const maxAttempts = 4
const maxDepth = 2

function getPageLinks (baseURL, pageToVisit, depth = 0, attempt = 0) {
  if (depth > maxDepth || attempt > maxAttempts) {
    return false
  }
  if (debug) {
    console.log(sep)
    console.log(`Visiting page ${pageToVisit}`)
    console.log(`Maxdepth=${maxDepth}, Depth=${depth}`)
  }
  const options = {
    uri: pageToVisit,
    transform: cheerio.load,
  }
  return rp(options)
    .then($ => {
      const title = $('title').text()
      // const body = $('body').text()
      db.addNode({
        title: title,
        url: pageToVisit,
        // body: body,
      })
      let childPromises = []
      $('a[href^="/"]').each(function () {
        const outlink = `${baseURL}${$(this).attr('href')}`
        const childPromise = processLink(baseURL, outlink, pageToVisit, depth)
        if (!childPromise) {
          return
        }
        childPromises.push(childPromise)
      })
      if (childPromises.length !== 0) {
        return Promise
          .all(childPromises)
          .then(results => {
            results.forEach(dest => processResult(pageToVisit, dest))
          })
      }
      return Promise.resolve(pageToVisit)
    })
    .catch(err => {
      if (err.respose === undefined) {
        console.log(`Attempt ${attempt}: ${pageToVisit}`)
        setTimeout(
          () => getPageLinks(baseURL, pageToVisit, depth, attempt + 1),
          Math.random() * (retryDelayMax - retryDelayMin) + retryDelayMin
        )
        return
      }
      console.error(err)
    })
}

function processResult (from, dest) {
  if (!dest) {
    return
  }
  db.addConnection(from, dest)
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
  getPageLinks(baseURL, baseURL)
    .then(() => {
      console.log('All done')
    })
}
