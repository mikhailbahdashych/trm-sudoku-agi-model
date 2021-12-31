const tipService = require('../services/tipService')

exports.getTipById = async (req, res) => {
  const { id } = req.params
  const data = await tipService.getTipById(id)
  res.json(data)
}
