module.exports = twoFa => {
  if (twoFa) {
    const regex = new RegExp('^\\d{6}$')
    return regex.test(twoFa);
  }
  return false
}
