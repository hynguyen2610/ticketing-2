"use strict";
exports.__esModule = true;
var not_authorized_error_1 = require("../errors/not-authorized-error");
exports.requireAuth = function (req, res, next) {
    if (!req.currentUser) {
        throw new not_authorized_error_1.NotAuthorizedError();
    }
    next();
};
