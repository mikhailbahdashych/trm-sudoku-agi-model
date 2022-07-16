const router = require('express').Router();
const wrapAsync = require('./middlewares/async');

const userController = require('./controllers/userController');
const blogController = require('./controllers/blogController');
const forumController = require('./controllers/forumController');
const questionController = require('./controllers/qaController');
const voteController = require('./controllers/voteController');
const searchController = require('./controllers/searchController');

const v = require('./middlewares/validator');
const authMiddleware = require('./middlewares/auth');
const basicAuth = require('./middlewares/basicAuth');

router.post("/sign-in", wrapAsync(userController.signIn));
router.post("/sign-up", wrapAsync(userController.signUp));
router.post("/change-password", authMiddleware, wrapAsync(userController.changePassword));
router.post("/change-email", authMiddleware, wrapAsync(userController.changeEmail));
router.post("/set-2fa", authMiddleware, wrapAsync(userController.setTwoFa));
router.post("/disable-2fa", authMiddleware, wrapAsync(userController.disableTwoFa));
router.post("/delete-account", authMiddleware, wrapAsync(userController.deleteAccount));

router.get("/get-refreshed-tokens", wrapAsync(userController.refreshToken));

router.get("/get-user-by-personal-id/:personalId", basicAuth, wrapAsync(userController.getUserByPersonalId));
router.get("/get-user-last-activity/:personalId", basicAuth, wrapAsync(userController.getLastActivity));
router.get("/get-user-settings/:t", authMiddleware, wrapAsync(userController.getUserSettings));

router.post("/search", wrapAsync(searchController.search))

router.patch("/update-user-personal-information", authMiddleware, wrapAsync(userController.updateUserPersonalInformation));

router.patch("/vote/:id/:type", authMiddleware, wrapAsync(voteController.vote))

router.get("/get-blog-post/:id", basicAuth, wrapAsync(blogController.getBlogPostById));
router.get("/get-forum-thread/:id", basicAuth, wrapAsync(forumController.getForumThreadById));
router.get("/get-question/:id", basicAuth, wrapAsync(questionController.getQuestionById));

router.post("/create-blog-post", authMiddleware, wrapAsync(blogController.createBlogPost));
router.post("/create-forum-post", authMiddleware, wrapAsync(forumController.createForumThread));
router.post("/create-question-post", authMiddleware, wrapAsync(questionController.createQuestion));

module.exports = router;
