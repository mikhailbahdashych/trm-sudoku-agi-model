const userService = require('../services/userService');

exports.signIn = async (req, res) => {
  const data = await userService.signIn(req.body)
  res.json(data)
}

exports.signUn = async (req, res) => {
  const data = await userService.signUp(req.body)
  res.json(data)
}
