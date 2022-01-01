const router = require('express').Router();
const wrapAsync = require('./../middlewares/async')

const generalController = require('../controllers/general')

router.get(
  "/get-latest-releases/:q",
  wrapAsync(generalController.getLatestReleases)
)

router.get(
  "/get-post/:id",
  wrapAsync(generalController.getPostById)
)

module.exports = router;
