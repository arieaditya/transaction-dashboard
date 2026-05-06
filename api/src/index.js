const express = require('express')
const cors = require('cors')
require('dotenv').config()

const transactionRoutes = require('./routes/transactions')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/transactions', transactionRoutes)

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})