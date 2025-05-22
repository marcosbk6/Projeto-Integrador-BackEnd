const express = require('express');
const router = express.Router();
const produtos = require('../data/produtos.json');

router.get('/', (req, res) => {
  const femininos = produtos.perfumes.filter(p => p.genero === "Feminino");
  res.json(femininos);
});

module.exports = router;
