module.exports = personalId => {
  if (personalId) {
    const regex = new RegExp('^\\d{10}$')
    return regex.test(personalId);
  }
  return false
}
