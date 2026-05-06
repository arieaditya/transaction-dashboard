const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        c.name AS "customerName",
        c.email,
        t.amount,
        t.payment_method AS "paymentMethod",
        t.status,
        t.created_at AS "createdAt",
        t.refundable
      FROM transactions t
      JOIN customers c ON c.id = t.customer_id
      ORDER BY t.created_at DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT
        t.id,
        c.name AS "customerName",
        c.email,
        t.amount,
        t.payment_method AS "paymentMethod",
        t.status,
        t.created_at AS "createdAt",
        t.refundable
      FROM transactions t
      JOIN customers c ON c.id = t.customer_id
      WHERE t.id = $1
      LIMIT 1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch transaction detail' })
  }
})

router.post('/:id/refund', async (req, res) => {
  const client = await pool.connect()

  try {
    const { id } = req.params
    const { reason } = req.body

    await client.query('BEGIN')

    const transactionResult = await client.query(
      `SELECT id, status, refundable
       FROM transactions
       WHERE id = $1
       LIMIT 1`,
      [id]
    )

    if (transactionResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Transaction not found' })
    }

    const transaction = transactionResult.rows[0]

    if (!transaction.refundable) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Transaction is not refundable' })
    }

    await client.query(
      `INSERT INTO refunds (transaction_id, reason)
       VALUES ($1, $2)`,
      [id, reason || 'Manual refund request from dashboard']
    )

    await client.query(
      `UPDATE transactions
       SET status = 'REFUNDED',
           refundable = false
       WHERE id = $1`,
      [id]
    )

    await client.query('COMMIT')

    res.status(201).json({
      message: 'Refund created successfully',
      transactionId: id
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)
    res.status(500).json({ error: 'Failed to create refund' })
  } finally {
    client.release()
  }
})

module.exports = router