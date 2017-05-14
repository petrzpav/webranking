'use strict'

const express = require('express')
const app = express()

app.get('/', function (req, res) {
  const home = require('fs')
  try {
    var data = home.readFileSync('home.html', 'utf8')
    res.send(data)
  } catch (e) {
    console.log('Error:', e.stack)
  }
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
