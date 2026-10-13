const express = require('express');
const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // every client route requires a valid JWT

router.route('/').post(createClient).get(getClients);
router.route('/:id').get(getClient).put(updateClient).delete(deleteClient);

module.exports = router;
