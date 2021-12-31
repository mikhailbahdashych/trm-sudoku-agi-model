const router = require('express').Router();
const wrapAsync = require('./../middlewares/async')

const articleController = require('../controllers/article')
const tipController = require('../controllers/tip')
const generalController = require('../controllers/general')

router.get(
  "/get-latest-releases/:q",
  wrapAsync(generalController.getLatestReleases)
)

router.get(
  "/get-article/:id",
  wrapAsync(articleController.getArticleById)
)

router.get(
  "/get-tip/:id",
  wrapAsync()
)

module.exports = router;
