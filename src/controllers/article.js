const articleService = require('./../services/articleService')

exports.getArticles = async (req, res) => {
  const result = await articleService.getArticles()
  res.json(result)
}
