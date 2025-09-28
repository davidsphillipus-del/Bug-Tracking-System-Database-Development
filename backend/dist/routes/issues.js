"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const issueController_1 = require("../controllers/issueController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post('/', issueController_1.createIssue);
router.get('/', issueController_1.getIssues);
router.get('/:id', issueController_1.getIssueById);
router.put('/:id/status', issueController_1.updateIssueStatus);
router.put('/:id/assign', issueController_1.assignIssue);
router.post('/:id/comments', issueController_1.addComment);
exports.default = router;
//# sourceMappingURL=issues.js.map