'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const db = require('../db')
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true,
}))

app.get('/', function (req, res) {
  const fs = require('fs')
  try {
    const data = fs.readFileSync(`${__dirname}${path.sep}home.html`, 'utf8')
    res.send(data)
  } catch (e) {
    console.log('Error:', e.stack)
  }
})

app.post('/query', function (req, res) {
  const fs = require('fs')
  try {
    const queryWord = req.body.queryWord
    const data = fs.readFileSync(`${__dirname}${path.sep}response.html`, 'utf8')
    const job = {
      data: {
        query: `match (p:Page) where p.body contains '${queryWord}' 
        return p.title as title, collect(distinct p.url)[0] as url, p.pr as pr 
        order by pr desc`,
        callback: response => {
          let resp = '<ol>'
          response.forEach(page => {
            resp += `<li>[${page.pr}] <a href="${page.url}">${page.title}</a></li>`
          })
          resp += '</ol>'
          const answer = data.toString().replace('#queryWord#', resp)
          res.send(answer)
        },
      },
    }
    db.doQuery(job, () => {})
  } catch (e) {
    console.log('Error:', e.stack)
  }
})

module.exports = function main () {
  app.listen(3000, function () {
    console.log('Webranking 1.0.0 app listening on port 3000!')
  })
}

