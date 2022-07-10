const router = require('express').Router();
const wrapAsync = require('./middlewares/async');

const userController = require('./controllers/userController');
const blogController = require('./controllers/blogController');
const forumController = require('./controllers/forumController');
const questionController = require('./controllers/qaController');

const { v } = require('./middlewares/validator');
const basicAuth = require('./middlewares/basicAuth');

router.post("/sign-in", wrapAsync(userController.signIn));
router.post("/sign-up", wrapAsync(userController.signUp));
router.post("/change-password", wrapAsync(userController.changePassword));
router.post("/change-email", wrapAsync(userController.changeEmail));
router.post("/set-2fa", wrapAsync(userController.setTwoFa));
router.post("/disable-2fa", wrapAsync(userController.disableTwoFa));
router.post("/close-account", wrapAsync(userController.closeAccount));

router.get("/get-user-by-token", wrapAsync(userController.getUserByToken));
router.get("/get-user-by-personal-id/:personalId", basicAuth, wrapAsync(userController.getUserByPersonalId));
router.get("/get-user-last-activity/:personalId", basicAuth, wrapAsync(userController.getLastActivity));
router.get("/get-user-settings/:t", wrapAsync(userController.getUserSettings));

router.patch("/update-user-personal-information", wrapAsync(userController.updateUserPersonalInformation));

router.get("/get-blog-post/:postId", basicAuth, wrapAsync(blogController.getPostById));
router.get("/get-forum-post/:postId", basicAuth, wrapAsync(forumController.getPostById));
router.get("/get-question/:questionId", basicAuth, wrapAsync(questionController.getQuestionById));

router.post("/create-blog-post", wrapAsync(blogController.createPost));
router.post("/create-forum-post", wrapAsync(forumController.createPost));
router.post("/create-question-post", wrapAsync(questionController.createPost));
module.exports = router;
