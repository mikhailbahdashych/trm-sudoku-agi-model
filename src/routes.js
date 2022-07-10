const router = require('express').Router();
const wrapAsync = require('./middlewares/async');

const userController = require('./controllers/userController');
const blogController = require('./controllers/blogController');
const forumController = require('./controllers/forumController');
const questionController = require('./controllers/qaController');

const v = require('./middlewares/validator');
const auth = require('./middlewares/auth');
const basicAuth = require('./middlewares/basicAuth');

router.post("/sign-in", wrapAsync(userController.signIn));
router.post("/sign-up", wrapAsync(userController.signUp));
router.post("/change-password", auth, wrapAsync(userController.changePassword));
router.post("/change-email", auth, wrapAsync(userController.changeEmail));
router.post("/set-2fa", auth, wrapAsync(userController.setTwoFa));
router.post("/disable-2fa", auth, wrapAsync(userController.disableTwoFa));
router.post("/delete-account", auth, wrapAsync(userController.deleteAccount));

router.get("/get-user-by-token", wrapAsync(userController.getUserByToken));
router.post("/refresh-token", wrapAsync(userController.refreshToken));

router.get("/get-user-by-personal-id/:personalId", basicAuth, wrapAsync(userController.getUserByPersonalId));
router.get("/get-user-last-activity/:personalId", basicAuth, wrapAsync(userController.getLastActivity));
router.get("/get-user-settings/:t", auth, wrapAsync(userController.getUserSettings));

router.patch("/update-user-personal-information", auth, wrapAsync(userController.updateUserPersonalInformation));

router.get("/get-blog-post/:postId", basicAuth, wrapAsync(blogController.getPostById));
router.get("/get-forum-thread/:threadId", basicAuth, wrapAsync(forumController.getPostById));
router.get("/get-question/:questionId", basicAuth, wrapAsync(questionController.getQuestionById));

router.post("/create-blog-post", auth, wrapAsync(blogController.createPost));
router.post("/create-forum-post", auth, wrapAsync(forumController.createPost));
router.post("/create-question-post", auth, wrapAsync(questionController.createPost));

module.exports = router;
