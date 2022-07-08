const router = require('express').Router();
const wrapAsync = require('./middlewares/async');

const userController = require('./controllers/userController');
const blogController = require('./controllers/blogController');
const forumController = require('./controllers/forumController');
const questionController = require('./controllers/qaController');

const { v } = require('./middlewares/validator');

/**
 * @swagger
 * /sign-in:
 *  post:
 *    summary: Used to sign in user
 *    tags:
 *      - POST
 *    description:
 *      This resource allows an individual user to sign in the system.
 */
router.post("/sign-in", wrapAsync(userController.signIn));

/**
 * @swagger
 * /sign-up:
 *  post:
 *    summary: Used to sign up user
 *    tags:
 *      - POST
 *    description:
 *      This resource allows an individual user to sign up in the system.
 */
router.post("/sign-up", wrapAsync(userController.signUp));

/**
 * @swagger
 * /change-password:
 *  post:
 *    summary: Used to change user's password
 *    tags:
 *      - POST
 *    description:
 *      This resource allows an individual user to change password for his account.
 *      Operation is available only one time in 48 hours.
 */
router.post("/change-password", wrapAsync(userController.changePassword));

/**
 * @swagger
 * /change-email:
 *  post:
 *    summary: Used to change user's email
 *    tags:
 *      - POST
 *    description:
 *      This resource allows an individual user to change email for his account.
 *      Operation is available only one time per individual user.
 */
router.post("/change-email", wrapAsync(userController.changeEmail));

/**
 * @swagger
 * /set-2fa:
 *  post:
 *    summary: Used to set two-factor authentication
 *    tags:
 *      - POST
 *    description:
 *      This resource allows an individual user to set up 2FA for account.
 */
router.post("/set-2fa", wrapAsync(userController.setTwoFa));

/**
 * @swagger
 * /disable-2fa:
 *  post:
 *    summary: Used to set two-factor authentication
 *    tags:
 *      - POST
 *    description:
 *      This resource allows an individual user to disable 2FA for account.
 */
router.post("/disable-2fa", wrapAsync(userController.disableTwoFa));

/**
 * @swagger
 * /close-account:
 *  post:
 *    summary: Used to close user's account
 *    tags:
 *      - POST
 *    description:
 *      This resource allows an individual user to close his account.
 *      Operation makes account unavailable for normal user.
 *      All public information become hidden from other users.
 *      Account can be restored by sign in system during 6 months.
 */
router.post("/close-account", wrapAsync(userController.closeAccount));

/**
 * @swagger
 * /get-user-by-token:
 *  get:
 *    summary: Used to get user by JWT
 *    tags:
 *      - GET
 *    description:
 *      Token and user's id are encrypted with private/public key pair RSA (AES-256-CBC).
 *      Used to verify user and allow to do operations that require user to be sign in.
 */
router.get("/get-user-by-token", wrapAsync(userController.getUserByToken));

/**
 * @swagger
 * /get-user-by-personal-id/{personalId}:
 *  get:
 *    summary: Used to get user by personal ID
 *    tags:
 *      - GET
 *    description:
 *      Personal ID is 10 digits random generated number unique for each user (public ID).
 *      Can be changed by user from personal settings.
 *    parameters:
 *      - in: path
 *        name: personalId
 *        required: true
 *        description: The user personal ID
 */
router.get("/get-user-by-personal-id/:personalId", wrapAsync(userController.getUserByPersonalId));

/**
 * @swagger
 * /get-user-last-activity/{personalId}:
 *  get:
 *    summary: Used to get user's last activity
 *    tags:
 *      - GET
 *    description:
 *      Used to get user's last activity on site such as last forum/blog posts and asked questions.
 *      Visible on public data on user's profile page.
 *    parameters:
 *      - in: path
 *        name: personalId
 *        required: true
 *        description: The user personal ID
 */
router.get("/get-user-last-activity/:personalId", wrapAsync(userController.getLastActivity));

/**
 * @swagger
 * /get-user-settings/{t}:
 *  get:
 *    summary: Used to get user's settings to edit
 *    tags:
 *      - GET
 *    description:
 *      Endpoint used to get user's settings (personal, security and site settings)
 */
router.get("/get-user-settings", wrapAsync(userController.getUserSettings));

/**
 * @swagger
 * /update-user-personal-information:
 *  patch:
 *    summary: Used to update user's personal information
 *    tags:
 *      - PATCH
 *    description:
 *      This resource allows an individual user update user's personal information.
 */
router.patch("/update-user-personal-information", wrapAsync(userController.updateUserPersonalInformation));



router.get("/get-blog-post/:postId", wrapAsync(blogController.getPostById));
router.get("/get-forum-post/:postId", wrapAsync(forumController.getPostById));
router.get("/get-question/:questionId", wrapAsync(questionController.getQuestionById));

router.post("/create-blog-post", wrapAsync(blogController.createPost));
router.post("/create-forum-post", wrapAsync(forumController.createPost));
router.post("/create-question-post", wrapAsync(questionController.createPost));
module.exports = router;
