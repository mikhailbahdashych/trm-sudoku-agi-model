const router = require('express').Router();
const wrapAsync = require('./../middlewares/async')

const articleController = require('../controllers/article')
const tipController = require('../controllers/tip')
const writeUpController = require('../controllers/writeup')
const ctfController = require('../controllers/ctf')
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
  wrapAsync(tipController.getTipById)
)

router.get(
  "/get-write-up/:id",
  wrapAsync(writeUpController.getWriteUpById)
)

router.get(
  "/get-ctf/:id",
  wrapAsync(ctfController.getCtfById)
)

module.exports = router;
