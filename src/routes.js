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

router.post('/sign-in', v(['email', 'password', 'phone', 'twoFa']), wrapAsync(userController.signIn));
router.post('/sign-up', v(['email', 'password', 'username', 'personalInformation']), wrapAsync(userController.signUp));
router.post('/change-password', v(['password', 'newPassword', 'newPasswordRepeat', 'twoFa']), authMiddleware, wrapAsync(userController.changePassword));
router.post('/change-email', v(['email', 'twoFa']), authMiddleware, wrapAsync(userController.changeEmail));
router.post('/set-2fa', v(['twoFa']), authMiddleware, wrapAsync(userController.setTwoFa));
router.post('/disable-2fa', v(['twoFa']), authMiddleware, wrapAsync(userController.disableTwoFa));
router.post('/delete-account', v(['password', 'twoFa']), authMiddleware, wrapAsync(userController.deleteAccount));

router.get('/get-refreshed-tokens', wrapAsync(userController.refreshToken));

router.get('/get-user-by-personal-id/:personalId', basicAuth, wrapAsync(userController.getUserByPersonalId));
router.get('/get-user-last-activity/:personalId', basicAuth, wrapAsync(userController.getLastActivity));
router.get('/get-user-settings/:t', authMiddleware, wrapAsync(userController.getUserSettings));

router.get('/search', basicAuth, wrapAsync(searchController.search))

router.patch('/update-user-personal-information', v(['personalInformation']), authMiddleware, wrapAsync(userController.updateUserPersonalInformation));

router.patch('/vote/:id/:v/:type', authMiddleware, wrapAsync(voteController.vote))

router.get('/get-question', basicAuth, wrapAsync(questionController.getQuestion))
router.get('/get-questions/:sort', basicAuth, wrapAsync(questionController.getQuestions))
router.post('/answer-question', basicAuth, wrapAsync(questionController.answerQuestion))

router.get('/get-blog-post', basicAuth, wrapAsync(blogController.getBlogPost))
router.get('/get-blog-posts/:by', basicAuth, wrapAsync(blogController.getBlogPosts))

router.get('/get-forum-thread', basicAuth, wrapAsync(forumController.getForumThread))
router.get('/get-forum-threads/:by', basicAuth, wrapAsync(forumController.getForumThreads))

router.post('/create-blog-post', authMiddleware, wrapAsync(blogController.createBlogPost));
router.post('/create-forum-thread', authMiddleware, wrapAsync(forumController.createForumThread));
router.post('/create-question', authMiddleware, wrapAsync(questionController.createQuestion));

module.exports = router;
