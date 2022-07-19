const allowedFields = ['first_name', 'last_name', 'status', 'company', 'location', 'about_me', 'website_link', 'twitter', 'github']

module.exports = personalInformation => {
  if (personalInformation) {
    const results = []

    Object.entries(personalInformation).forEach(item => { if (!(item[0] in allowedFields)) return false })

    Object.entries(personalInformation).forEach(item => {
      if ((item[0] === 'first_name' || item[0] === 'last_name')) results.push(item[1].length > 35)
      if (item[0] === 'status') results.push(item[1].length > 200)
      if (item[0] === 'about_me') results.push(item[1].length > 600)
      if (item[0] === 'show_email') results.push(typeof item[1] !== 'boolean')
      if (item[0] === 'github') results.push(item[1].substring(0, 10) !== 'github.com')
      if (item[0] === 'twitter') results.push(item[1].substring(0, 4) !== 't.co')
    })

    results.forEach(item => { if (!item) return false })

    return true
  }
  return false
}
