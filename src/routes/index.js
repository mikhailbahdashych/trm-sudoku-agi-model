const router = require('express').Router();
const wrapAsync = require('./../middlewares/async');

const userController = require('../controllers/userController');
const twoFaController = require('../controllers/twoFaController');

const { v } = require('../middlewares/validator');

router.post("/sign-in", wrapAsync(userController.signIn));
router.post("/sign-up", wrapAsync(userController.signUp));
router.post("/change-password", wrapAsync(userController.changePassword));
router.post("/change-email", wrapAsync(userController.changeEmail));
router.post("/close-account", wrapAsync(userController.closeAccount));

router.get("/get-user-by-token", wrapAsync(userController.getUserByToken));
router.get("/get-user-by-personal-id/:personalId", wrapAsync(userController.getUserByPersonalId));
router.get("/get-user-last-activity/:personalId", wrapAsync(userController.getLastActivity));

router.get("/get-user-settings/:t", wrapAsync(userController.getUserSettings))
router.patch("/update-user-personal-information", wrapAsync(userController.updateUserPersonalInformation));

router.post("/set-2fa", wrapAsync(twoFaController.setTwoFa));
router.post("/disable-2fa", wrapAsync(twoFaController.disableTwoFa));

module.exports = router;
