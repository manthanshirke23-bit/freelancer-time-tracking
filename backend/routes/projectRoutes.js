const express = require('express');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getInvoiceTotal,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // every project route requires a valid JWT

router.route('/').post(createProject).get(getProjects);
router.get('/:id/invoice-total', getInvoiceTotal);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

module.exports = router;
