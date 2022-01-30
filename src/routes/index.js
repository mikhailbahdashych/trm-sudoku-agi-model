const router = require('express').Router();
const wrapAsync = require('./../middlewares/async')

const generalController = require('../controllers/general')
const emailController = require('../controllers/email')

router.get(
  "/get-selected-releases/:q",
  wrapAsync(generalController.getSelectedReleases)
)

router.get(
  "/get-latest-releases/:q",
  wrapAsync(generalController.getLatestReleases)
)

router.get(
  "/get-post/:id",
  wrapAsync(generalController.getPostById)
)

router.get(
  "/get-posts-by-category/:category/:from/:to",
  wrapAsync(generalController.getPostsByCategory)
)

router.post(
  "/search",
  wrapAsync(generalController.search)
)

router.post(
  "/send-email",
  wrapAsync(emailController.sendEmail)
)

module.exports = router;
