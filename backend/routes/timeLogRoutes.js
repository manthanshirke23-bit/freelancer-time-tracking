const express = require('express');
const {
  createTimeLog,
  getTimeLogs,
  getTimeLog,
  updateTimeLog,
  deleteTimeLog,
} = require('../controllers/timeLogController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // every time log route requires a valid JWT

router.route('/').post(createTimeLog).get(getTimeLogs);
router.route('/:id').get(getTimeLog).put(updateTimeLog).delete(deleteTimeLog);

module.exports = router;
