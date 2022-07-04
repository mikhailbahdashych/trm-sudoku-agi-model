const twoFactorService = require('node-2fa');

exports.verifyTwoFa = (clientToken, clientTwoFaCode) => {
  const result2Fa = twoFactorService.verifyToken(clientToken, clientTwoFaCode)

  if (!result2Fa) return false
  return result2Fa.delta === 0;
}
