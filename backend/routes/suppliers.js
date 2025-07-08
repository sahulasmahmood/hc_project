const express = require('express');
const router = express.Router();
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  restoreSupplier,
  deleteSupplierPermanently
} = require('../controllers/settings/inventorySettings/suppliers');

// GET all suppliers
router.get('/', getAllSuppliers);

// GET supplier by ID
router.get('/:id', getSupplierById);

// POST create new supplier
router.post('/', createSupplier);

// PUT update supplier
router.put('/:id', updateSupplier);

// DELETE supplier
router.delete('/:id', deleteSupplier);

// PATCH restore supplier
router.patch('/:id/restore', restoreSupplier);

module.exports = router; 