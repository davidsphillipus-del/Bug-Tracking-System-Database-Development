"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComment = exports.assignIssue = exports.updateIssueStatus = exports.getIssueById = exports.getIssues = exports.createIssue = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const mssql_1 = __importDefault(require("mssql"));
const db = database_1.default.getInstance();
exports.createIssue = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { ProjectID, Title, Description, IssueType, Priority, Severity, AssignedToUserID, EstimatedHours, InitialComment } = req.body;
    if (!ProjectID || !Title || !Description || !IssueType || !Priority) {
        throw (0, errorHandler_1.createError)('ProjectID, Title, Description, IssueType, and Priority are required', 400);
    }
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        const pool = await db.connect();
        const request = pool.request();
        request.input('ProjectID', mssql_1.default.Int, ProjectID);
        request.input('Title', mssql_1.default.NVarChar(200), Title);
        request.input('Description', mssql_1.default.NVarChar(mssql_1.default.MAX), Description);
        request.input('IssueType', mssql_1.default.NVarChar(20), IssueType);
        request.input('Priority', mssql_1.default.NVarChar(20), Priority);
        request.input('Severity', mssql_1.default.NVarChar(20), Severity || null);
        request.input('ReporterUserID', mssql_1.default.Int, req.user.userId);
        request.input('AssignedToUserID', mssql_1.default.Int, AssignedToUserID || null);
        request.input('EstimatedHours', mssql_1.default.Decimal(5, 2), EstimatedHours || null);
        request.input('InitialComment', mssql_1.default.NVarChar(mssql_1.default.MAX), InitialComment || null);
        request.output('IssueID', mssql_1.default.Int);
        const result = await request.execute('sp_CreateIssueWithTransaction');
        const IssueID = result.output.IssueID;
        const response = {
            success: true,
            message: 'Issue created successfully',
            data: { IssueID }
        };
        res.status(201).json(response);
    }
    catch (error) {
        if (error.message.includes('Invalid or inactive project')) {
            throw (0, errorHandler_1.createError)('Invalid or inactive project', 400);
        }
        else if (error.message.includes('Invalid issue type')) {
            throw (0, errorHandler_1.createError)('Invalid issue type', 400);
        }
        else if (error.message.includes('Invalid priority')) {
            throw (0, errorHandler_1.createError)('Invalid priority', 400);
        }
        throw (0, errorHandler_1.createError)('Failed to create issue', 500);
    }
});
exports.getIssues = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { projectId, status, priority, assignedToUserId, pageNumber = 1, pageSize = 50 } = req.query;
    try {
        const pool = await db.connect();
        const request = pool.request();
        request.input('ProjectID', mssql_1.default.Int, projectId || null);
        request.input('Status', mssql_1.default.NVarChar(20), status || null);
        request.input('Priority', mssql_1.default.NVarChar(20), priority || null);
        request.input('AssignedToUserID', mssql_1.default.Int, assignedToUserId || null);
        request.input('PageNumber', mssql_1.default.Int, pageNumber);
        request.input('PageSize', mssql_1.default.Int, pageSize);
        const result = await request.execute('sp_GetIssuesByProject');
        const issues = result.recordset || [];
        const totalRecords = issues.length > 0 ? issues[0].TotalRecords : 0;
        const totalPages = Math.ceil(totalRecords / Number(pageSize));
        const response = {
            success: true,
            data: {
                data: issues,
                totalRecords,
                pageNumber: Number(pageNumber),
                pageSize: Number(pageSize),
                totalPages
            }
        };
        res.json(response);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)('Failed to fetch issues', 500);
    }
});
exports.getIssueById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const issueId = parseInt(id);
    if (isNaN(issueId)) {
        throw (0, errorHandler_1.createError)('Invalid issue ID', 400);
    }
    try {
        const pool = await db.connect();
        const request = pool.request();
        request.input('IssueID', mssql_1.default.Int, issueId);
        const result = await request.execute('sp_GetIssueDetails');
        if (!result.recordsets || result.recordsets.length < 4) {
            throw (0, errorHandler_1.createError)('Issue not found', 404);
        }
        const [issueRecords, commentRecords, historyRecords, attachmentRecords] = result.recordsets;
        if (!issueRecords || issueRecords.length === 0) {
            throw (0, errorHandler_1.createError)('Issue not found', 404);
        }
        const issueDetails = {
            issue: issueRecords[0],
            comments: commentRecords || [],
            history: historyRecords || [],
            attachments: attachmentRecords || []
        };
        const response = {
            success: true,
            data: issueDetails
        };
        res.json(response);
    }
    catch (error) {
        if (error.statusCode === 404) {
            throw error;
        }
        throw (0, errorHandler_1.createError)('Failed to fetch issue details', 500);
    }
});
exports.updateIssueStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const issueId = parseInt(id);
    const { NewStatus, Comments } = req.body;
    if (isNaN(issueId)) {
        throw (0, errorHandler_1.createError)('Invalid issue ID', 400);
    }
    if (!NewStatus) {
        throw (0, errorHandler_1.createError)('NewStatus is required', 400);
    }
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        const pool = await db.connect();
        const request = pool.request();
        request.input('IssueID', mssql_1.default.Int, issueId);
        request.input('NewStatus', mssql_1.default.NVarChar(20), NewStatus);
        request.input('ModifiedByUserID', mssql_1.default.Int, req.user.userId);
        request.input('Comments', mssql_1.default.NVarChar(mssql_1.default.MAX), Comments || null);
        await request.execute('sp_UpdateIssueStatus');
        const response = {
            success: true,
            message: 'Issue status updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        if (error.message.includes('Issue not found')) {
            throw (0, errorHandler_1.createError)('Issue not found', 404);
        }
        else if (error.message.includes('Invalid status')) {
            throw (0, errorHandler_1.createError)('Invalid status', 400);
        }
        else if (error.message.includes('Invalid status transition')) {
            throw (0, errorHandler_1.createError)('Invalid status transition', 400);
        }
        throw (0, errorHandler_1.createError)('Failed to update issue status', 500);
    }
});
exports.assignIssue = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const issueId = parseInt(id);
    const { AssignedToUserID } = req.body;
    if (isNaN(issueId)) {
        throw (0, errorHandler_1.createError)('Invalid issue ID', 400);
    }
    if (!AssignedToUserID) {
        throw (0, errorHandler_1.createError)('AssignedToUserID is required', 400);
    }
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        const pool = await db.connect();
        const request = pool.request();
        request.input('IssueID', mssql_1.default.Int, issueId);
        request.input('AssignedToUserID', mssql_1.default.Int, AssignedToUserID);
        request.input('ModifiedByUserID', mssql_1.default.Int, req.user.userId);
        await request.execute('sp_AssignIssue');
        const response = {
            success: true,
            message: 'Issue assigned successfully'
        };
        res.json(response);
    }
    catch (error) {
        if (error.message.includes('Issue not found')) {
            throw (0, errorHandler_1.createError)('Issue not found', 404);
        }
        else if (error.message.includes('Assigned user not found')) {
            throw (0, errorHandler_1.createError)('Assigned user not found or inactive', 400);
        }
        throw (0, errorHandler_1.createError)('Failed to assign issue', 500);
    }
});
exports.addComment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const issueId = parseInt(id);
    const { CommentText, IsInternal = false } = req.body;
    if (isNaN(issueId)) {
        throw (0, errorHandler_1.createError)('Invalid issue ID', 400);
    }
    if (!CommentText || CommentText.trim().length === 0) {
        throw (0, errorHandler_1.createError)('Comment text is required', 400);
    }
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        const pool = await db.connect();
        const request = pool.request();
        request.input('IssueID', mssql_1.default.Int, issueId);
        request.input('UserID', mssql_1.default.Int, req.user.userId);
        request.input('CommentText', mssql_1.default.NVarChar(mssql_1.default.MAX), CommentText.trim());
        request.input('IsInternal', mssql_1.default.Bit, IsInternal);
        await request.query(`
      INSERT INTO Comments (IssueID, UserID, CommentText, IsInternal)
      VALUES (@IssueID, @UserID, @CommentText, @IsInternal)
    `);
        const response = {
            success: true,
            message: 'Comment added successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)('Failed to add comment', 500);
    }
});
//# sourceMappingURL=issueController.js.map