'use strict'

const neo4j = require('neo4j')
const kue = require('kue')

const queryQueue = kue.createQueue({
  jobEvents: false,
})

// Full options:
const db = new neo4j.GraphDatabase({
  url: 'http://localhost:7474',
  auth: {username: 'neo4j', password: 'admin'},
})

function doNodeQuery (job, done) {
  // add only connection, node already exists
  if (!job.data.node) {
    doConnectionQuery(job.data.srcUrl, job.data.destUrl, done)
    return
  }
  // add node, afther that add connection
  db.cypher({
    query: 'create(:Page {title: {title}, url: {url}, body: {body}})',
    params: {
      title: job.data.node.title,
      url: job.data.node.url,
      body: job.data.node.body,
    },
  }, (err, results) => {
    if (err) {
      console.log(err)
      // throw err
    }
    // root node
    if (!job.data.node.parentUrl) {
      done()
      return
    }
    console.log(`[Node] ${job.data.node.url}`)
    doConnectionQuery(job.data.node.parentUrl, job.data.node.url, done)
  })
}

function doConnectionQuery (srcUrl, destUrl, done) {
  db.cypher({
    query: `match (src:Page {url: {srcUrl}}), (dest:Page {url: {destUrl}})
USING INDEX src:Page(url) USING INDEX dest:Page(url)
create (src)-[r:linksTo]->(dest)`,
    params: {
      srcUrl: srcUrl,
      destUrl: destUrl,
    },
    lean: true,
  }, (err, results) => {
    if (err) {
      console.log(err)
      // throw err
    }
    console.log(`[Conn] ${srcUrl} => ${destUrl}`)
    done()
  })
}

function addNode (node) {
  // console.log(`[AddNode] ${node.title}`)
  queryQueue.create('glob_query', {
    node: node,
  }).removeOnComplete(true).save()
}

function addConnection (srcUrl, destUrl) {
  // console.log(`[AddConn] ${srcUrl} => ${destUrl}`)
  queryQueue.create('glob_query', {
    node: null,
    srcUrl: srcUrl,
    destUrl: destUrl,
  }).removeOnComplete(true).save()
}

function doQuery (job, done) {
  db.cypher(job.data.query, (err, results) => {
    if (err) {
      console.log(err)
      // throw err
    }
    done()
    if (!job.data.callback) {
      return
    }
    job.data.callback(results)
  })
}

function query (query, callback) {
  queryQueue.create('query', {
    query: query,
    callback: callback,
  }).removeOnComplete(true).save()
}

query('CREATE INDEX ON :Page(url);')
queryQueue.process('glob_query', 1, doNodeQuery)
queryQueue.process('query', 1, doQuery)

exports.addNode = addNode
exports.addConnection = addConnection
exports.query = query
exports.doQuery = doQuery
