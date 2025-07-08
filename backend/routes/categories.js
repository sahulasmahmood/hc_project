const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  deleteCategoryPermanently
} = require('../controllers/settings/inventorySettings/categories');

// GET all categories
router.get('/', getAllCategories);

// GET category by ID
router.get('/:id', getCategoryById);

// POST create new category
router.post('/', createCategory);

// PUT update category
router.put('/:id', updateCategory);

// DELETE category
router.delete('/:id', deleteCategory);

// PATCH restore category
router.patch('/:id/restore', restoreCategory);

module.exports = router; 