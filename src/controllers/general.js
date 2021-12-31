const articleService = require('./../services/articleService')
const tipService = require('./../services/tipService')
const writeUpService = require('./../services/writeUpService')
const ctfService = require('./../services/ctfService')

exports.getLatestReleases = async (req, res) => {
  const { q } = req.params
  const articles = await articleService.getArticles(q)
  const ctfs = await ctfService.getCtfs(q)
  const writeups = await writeUpService.getWriteUps(q)
  const data = []
  articles.forEach(item => {
    item['type'] = 'article'
    data.push(item)
  })
  ctfs.forEach(item => {
    item['type'] = 'ctf'
    data.push(item)
  })
  writeups.forEach(item => {
    item['type'] = 'writeup'
    data.push(item)
  })
  res.json(data)
}
