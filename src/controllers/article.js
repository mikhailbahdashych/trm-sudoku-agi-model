const articleService = require('./../services/articleService')

exports.getLatestReleases = async (req, res) => {
  const { q } = req.params
  const result = await articleService.getArticles(q)
  res.json(result)
}
