'use strict'

const neo4j = require('neo4j');

// Full options:
const db = new neo4j.GraphDatabase({
  url: 'http://localhost:7474',
  auth: {username: 'node', password: 'admin'},
})

function globalCallback(err, results) {
  if (err) {
    throw err
  }
  // skip results..
}

function addNode (node) {
  console.log(`creating ${node.url}`)
  db.cypher({
    // query: 'create(:Page {title: {title}, url: {url}, body: {body}})',
    query: 'create(:Page {title: {title}, url: {url}})',
    params: {
      title: node.title,
      url: node.url,
      // body: node.body,
    },
  }, globalCallback)
}

function addConnection (srcUrl, destUrl) {
  console.log(`add connection ${srcUrl} => ${destUrl}`)
  db.cypher({
    query: `match (src:Page {url: {srcUrl}}), (dest:Page {url: {destUrl}})
create (src)-[r:linksTo]->(dest)`,
    params: {
      srcUrl: srcUrl,
      destUrl: destUrl,
    },
  }, globalCallback)
}

exports.addNode = addNode
exports.addConnection = addConnection
