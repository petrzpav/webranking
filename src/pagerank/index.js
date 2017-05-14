'use strict'

const db = require('../db')

const iterations = 10
const alfa = 0.85
const a = 1

function init () {
  // set 1/n to pages without outlinks
  db.query(`
    match (p:Page) where not (p)-[:linksTo]-() 
    with (1.0/count(*)) as init 
    match (p:Page) with p,init 
    set p.pr=init;`
  )
  // set 1/numOfOutlinks to pages with outlinks
  db.query(`
    match (p:Page)-[r:linksTo]->()
    with p, (1.0/count(p)) as cnt
    set p.pr=cnt;`
  )
  for (let i = 0; i < iterations; i++) {
    db.query(`
      match (s:Page)-[r:linksTo]->(d:Page)
      with s, ( ${alfa} * d.pr * s.pr + (${alfa} * s.pr * ${a} + 1 - ${alfa}) * 1/count(*) ) as newPR
      set s.pr=newPR`
    )
  }
}

module.exports = function main () {
  init()
}
