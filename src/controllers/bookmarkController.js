const knex = require('../knex/knex')

const bookmarkService = require('../services/bookmarkService')

const loggerInstance = require('../common/logger')
const logger = loggerInstance({ label: 'bookmarks-controller', path: 'bookmarks' })

exports.addBookmark = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { type, id } = req.body

    const result = await bookmarkService.addBookmark({
      type, id, userId: req.user
    }, { transaction })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.getBookmarks = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const bookmarks = await bookmarkService.getBookmarks({ userId: req.user })

    await transaction.commit()
    return res.status(200).json(bookmarks)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}

exports.deleteBookmark = async (req, res, next) => {
  const transaction = await knex.transaction()
  try {
    const { id } = req.params

    const result = await bookmarkService.deleteBookmark({
      id, userId: req.user
    })

    await transaction.commit()
    return res.status(200).json(result)
  } catch (e) {
    await transaction.rollback()
    next(e)
  }
}
