const articleService = require('./../services/articleService')

exports.getArticleById = async (req, res) => {
  const { id } = req.params
  const data = await articleService.getArticleById(id)
  res.json(data)
}
