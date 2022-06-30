const router = require('express').Router();
const wrapAsync = require('./../middlewares/async');

const userController = require('../controllers/userController');
const twoFaController = require('../controllers/twoFaController');

const { v } = require('../middlewares/validator');

router.post("/sign-in", wrapAsync(userController.signIn));
router.post("/sign-up", wrapAsync(userController.signUp));
router.post("/change-password", wrapAsync(userController.changePassword));

router.get("/get-user-by-token", wrapAsync(userController.getUserByToken));
router.get("/get-user-by-personal-id/:personalId", wrapAsync(userController.getUserByPersonalId));
router.get("/get-user-last-activity/:personalId", wrapAsync(userController.getLastActivity));

router.get("/get-user-settings", wrapAsync(userController.getUserSettings))
router.patch("/update-user-personal-information", wrapAsync(userController.updateUserPersonalInformation));
router.patch("/update-user-security-settings", wrapAsync(userController.updateUserSecuritySettings));

router.post("/set-2fa", wrapAsync(twoFaController.setTwoFa));
router.post("/disable-2fa", wrapAsync(twoFaController.disableTwoFa));

module.exports = router;
