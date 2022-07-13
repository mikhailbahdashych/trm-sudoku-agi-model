const twoFactorService = require('node-2fa');

exports.verifyTwoFa = (userToken, userTwoFaCode) => {
  const result2Fa = twoFactorService.verifyToken(userToken, userTwoFaCode)

  if (!result2Fa) return false
  return result2Fa.delta === 0;
}
