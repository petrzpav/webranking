'use strict'

const neo4j = require('neo4j');

// todo lock when deleting..
let nodes = []
let connections = []

// Full options:
const db = new neo4j.GraphDatabase({
  url: 'http://localhost:7474',
  auth: {username: 'node', password: 'admin'},
})

function globalCallback (err, results) {
  if (err) {
    throw err
  }
  // skip results..
}

function addNode (node) {
  console.log(`add ${node.url}`)
  nodes.push(node)
  if (nodes.length >= 50) {
    insertNodes()
    nodes = []
    global.gc()
  }
}

function insertNodes () {
  console.log('Batch inserting nodes')
  let batchQuery = []
  nodes.forEach(node => {
    batchQuery.push({
      // query: 'create(:Page {title: {title}, url: {url}, body: {body}})',
      query: 'create(:Page {title: {title}, url: {url}})',
      params: {
        title: node.title,
        url: node.url,
        // body: node.body,
        lean: true,
      },
    })
  })
  db.cypher(batchQuery, globalCallback)
}

function addConnection (srcUrl, destUrl) {
  console.log(`add connection ${srcUrl} => ${destUrl}`)
  connections.push([srcUrl, destUrl])
  if (connections.length >= 50) {
    insertConnections()
    connections = []
    global.gc()
  }
}

function insertConnections () {
  console.log('Batch inserting connections')
  let batchQuery = []
  connections.forEach(connection => {
    batchQuery.push({
      query: `match (src:Page {url: {srcUrl}}), (dest:Page {url: {destUrl}})
create (src)-[r:linksTo]->(dest)`,
      params: {
        srcUrl: connection[0],
        destUrl: connection[1],
        lean: true,
      },
      lean: true,
    })
  })
  db.cypher(batchQuery, globalCallback)
}

exports.addNode = addNode
exports.addConnection = addConnection
