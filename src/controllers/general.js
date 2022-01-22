const generalService = require('../services/generalService')

exports.getSelectedReleases = async (req, res) => {
  const data = await generalService.getSelectedReleases(req.params.q)
  res.json(data)
}

exports.getLatestReleases = async (req, res) => {
  const data = await generalService.getLatestReleases(req.params.q)
  res.json(data)
}

exports.getPostById = async (req, res) => {
  const result = await generalService.getPostById(req.params.id)
  res.json(result)
}

exports.getPostsByCategory = async (req, res) => {
  const { category, from, to } = req.params
  const result = await generalService.getPostsByCategory(category, from, to)
  res.json(result)
}

exports.search = async (req, res) => {
  const { input } = req.body
  const result = await generalService.search(input)
  res.json(result)
}
