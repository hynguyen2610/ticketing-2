"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const not_authorized_error_1 = require("../errors/not-authorized-error");
exports.requireAuth = (req, res, next) => {
    if (!req.currentUser) {
        throw new not_authorized_error_1.NotAuthorizedError();
    }
    next();
};
