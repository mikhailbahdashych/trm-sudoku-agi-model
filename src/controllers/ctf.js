const ctfService = require('../services/ctfService')

exports.getCtfById = async (req, res) => {
  const { id } = req.params
  const data = await ctfService.getCtfById(id)
  res.json(data)
}
