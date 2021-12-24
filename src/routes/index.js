const router = require('express').Router();
const wrapAsync = require('./../middlewares/async')

const articleController = require('../controllers/article')

router.get(
  "/get-latest-releases/:q",
  wrapAsync(articleController.getLatestReleases)
)

module.exports = router;
