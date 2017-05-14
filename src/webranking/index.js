'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.get('/', function (req, res) {
  const fs = require('fs')
  try {
    const data = fs.readFileSync('home.html', 'utf8')
    res.send(data)
  } catch (e) {
    console.log('Error:', e.stack)
  }
})

app.post('/query', function (req, res) {
  const fs = require('fs')
  try {
    const queryWord = req.body.queryWord
    const data = fs.readFileSync('response.html', 'utf8')

    const answer = data.toString().replace('#queryWord#', queryWord)

    res.send(answer)
  } catch (e) {
    console.log('Error:', e.stack)
  }
})

app.listen(3000, function () {
  console.log('Webranking 1.0.0 app listening on port 3000!')
})
