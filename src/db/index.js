'use strict'

function addNode (node) {
  console.log(`+ ${node}`)
}

function addConnection (srcNode, destNode) {
  console.log(`* ${srcNode} => ${destNode}`)
}

exports.addNode = addNode
exports.addConnection = addConnection
