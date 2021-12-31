const writeUpService = require('./../services/writeUpService')

exports.getWriteUpById = async (req, res) => {
  const { id } = req.params
  const data = await writeUpService.getWriteUpById(id)
  res.json(data)
}
