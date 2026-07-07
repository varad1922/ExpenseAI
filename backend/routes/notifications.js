const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect); // Secure all notification routes

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markAsRead);

module.exports = router;
