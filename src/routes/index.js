const router = require('express').Router();
const wrapAsync = require('./../middlewares/async');

const userController = require('../controllers/userController');

router.post(
  "/sign-in",
  wrapAsync(userController.signIn)
);

router.post(
  "/sign-up",
  wrapAsync(userController.signUp)
);

module.exports = router;
