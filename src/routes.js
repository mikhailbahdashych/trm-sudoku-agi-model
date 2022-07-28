const router = require('express').Router();
const wrapAsync = require('./middlewares/async');

const userController = require('./controllers/userController');
const blogController = require('./controllers/blogController');
const forumController = require('./controllers/forumController');
const questionController = require('./controllers/qaController');
const voteController = require('./controllers/voteController');
const searchController = require('./controllers/searchController');

const { v } = require('./middlewares/validator');
const authMiddleware = require('./middlewares/auth');
const basicAuth = require('./middlewares/basicAuth');

// @TODO Do research about white-space: pre-line and VueEditor

router.post('/user/sign-in', basicAuth, v(['email', 'password', 'phone', 'twoFa']), wrapAsync(userController.signIn));
router.post('/user/sign-up', basicAuth, v(['email', 'password', 'username', 'personalInformation']), wrapAsync(userController.signUp));
router.get('/user/:personalId', basicAuth, wrapAsync(userController.getUserByPersonalId));
router.get('/user/settings/:t', authMiddleware, wrapAsync(userController.getUserSettings));
router.patch('/user/password', v(['password', 'newPassword', 'newPasswordRepeat', 'twoFa']), authMiddleware, wrapAsync(userController.changePassword));
router.patch('/user/email', v(['email', 'twoFa']), authMiddleware, wrapAsync(userController.changeEmail));
router.patch('/user/2fa/set', v(['twoFa']), authMiddleware, wrapAsync(userController.setTwoFa));
router.patch('/user/2fa/disable', v(['twoFa']), authMiddleware, wrapAsync(userController.disableTwoFa));
router.patch('/user/mobile-phone/set', v(['twoFa']), authMiddleware, wrapAsync(userController.setMobilePhone));
router.patch('/user/mobile-phone/disable', v(['twoFa']), authMiddleware, wrapAsync(userController.disableMobilePhone));
router.patch('/user/delete-account', v(['password', 'twoFa']), authMiddleware, wrapAsync(userController.deleteAccount));
router.patch('/user/personal-information', v(['personalInformation']), authMiddleware, wrapAsync(userController.updateUserPersonalInformation));

router.post('/bookmark', authMiddleware, wrapAsync(userController.addBookmark));
router.get('/bookmark', authMiddleware, wrapAsync(userController.getBookmarks))
router.delete('/bookmark/:id', authMiddleware, wrapAsync(userController.deleteBookmark))

router.get('/refresh-tokens', basicAuth, wrapAsync(userController.refreshToken));

router.get('/search', basicAuth, wrapAsync(searchController.search));

router.patch('/vote/:id/:vote/:type', authMiddleware, wrapAsync(voteController.vote));

router.get('/question', basicAuth, wrapAsync(questionController.getQuestion));
router.get('/question/:sort', basicAuth, wrapAsync(questionController.getQuestions));
router.get('/user/:personalId/question/:sort', basicAuth, wrapAsync(questionController.getUserQuestions));
router.post('/question', v(['question']), authMiddleware, wrapAsync(questionController.createQuestion));
router.patch('/question/answer', authMiddleware, wrapAsync(questionController.answerQuestion));

router.get('/blog-post', basicAuth, wrapAsync(blogController.getBlogPost));
router.get('/blog-post/:sort', basicAuth, wrapAsync(blogController.getBlogPosts));
router.post('/blog-post', v(['post']), authMiddleware, wrapAsync(blogController.createBlogPost));
router.patch('/blog-post/comment', authMiddleware, wrapAsync(blogController.commentBlogPost));

router.get('/forum-thread', basicAuth, wrapAsync(forumController.getForumThread));
router.get('/forum-thread/:sort', basicAuth, wrapAsync(forumController.getForumThreads));
router.post('/forum-thread', v(['thread']), authMiddleware, wrapAsync(forumController.createForumThread));
router.patch('/forum-thread/comment', authMiddleware, wrapAsync(forumController.commentForumThread))

module.exports = router;
