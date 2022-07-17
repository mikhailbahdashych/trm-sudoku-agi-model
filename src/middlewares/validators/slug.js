module.exports = slug => {
  if (slug) {
    const regex = new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*$')
    return regex.test(slug);
  }
  return false
}
