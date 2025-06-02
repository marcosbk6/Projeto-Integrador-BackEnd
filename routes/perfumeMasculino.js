const express = require('express');
const router = express.Router();
const produtos = require('../data/produtos.json');

router.get('/', (req, res) => {
  const masculinos = produtos.perfumes.filter(p => p.genero === "Masculino");
  res.json(masculinos);
});

module.exports = router;
