const express = require('express');
const router = express.Router();
const produtos = require('../data/produtos.json');

router.get('/', (req, res) => {
  res.json(produtos.maquiagem);
});

module.exports = router;
