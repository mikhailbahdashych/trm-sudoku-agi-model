const userService = require('../services/userService')
const blogService = require('../services/blogService')
const forumService = require('../services/forumService')
const questionService = require('../services/qaService')

exports.search = async (req, res) => {
  try {
    const { slug } = req.query

    const users = await userService.getUser({ username: slug })
    const blogs = await blogService.getBlogPost({ title: slug })
    const threads = await forumService.getForumThread({ title: slug })
    const questions = await questionService.getQuestion({ slug })

    return res.status(200).json({ users, blogs, threads, questions })
  } catch (e) {
    return res.status(500).json({ message: 'something-went-wrong', status: 500 })
  }
}
