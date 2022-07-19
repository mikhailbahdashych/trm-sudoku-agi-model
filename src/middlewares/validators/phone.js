module.exports = phoneNumber => {
  if (phoneNumber) {
    const regex = new RegExp('^\\+[1-9]{1}[0-9]{3,14}$\n')
    return regex.test(phoneNumber)
  }
  return false
}
