const generalService = require('../services/generalService')

exports.getLatestReleases = async (req, res) => {
  const data = await generalService.getLatestReleases(req.params.q)
  res.json(data)
}

exports.getPostById = async (req, res) => {
  const result = await generalService.getPostById(req.params.id)
  res.json(result)
}
