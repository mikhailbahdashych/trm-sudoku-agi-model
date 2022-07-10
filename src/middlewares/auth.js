const jwt = require('jsonwebtoken');
const fs = require('fs')
const path = require("path");

const publicKey = fs.readFileSync(path.resolve(__dirname + "../../../keys/public.pem"));

module.exports = (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth)
      return res.status(401).json({ message: "unauthorized", status: 401 })

    const token = req.headers.authorization.split(' ')[1]
    const payload = jwt.verify(token, publicKey)

    if (payload.type !== 'access')
      return res.status(401).json({ message: "unauthorized", status: 401 })

    next();
  } catch (e) {
    return res.status(401).json({ message: "unauthorized", status: 401 })
  }
}
