"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.currentUser = function (req, res, next) {
    if (!req.session ? .jwt : ) {
        return next();
    }
    try {
        var payload = jsonwebtoken_1["default"].verify(req.session.jwt, process.env.JWT_KEY);
        req.currentUser = payload;
    }
    catch (err) { }
    next();
};
