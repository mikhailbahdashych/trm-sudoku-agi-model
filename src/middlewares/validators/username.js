module.exports = username => {
  return typeof username === 'string' && username.length >= 6;
}
