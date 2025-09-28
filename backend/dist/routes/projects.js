"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const mssql_1 = __importDefault(require("mssql"));
const router = (0, express_1.Router)();
const db = database_1.default.getInstance();
router.use(auth_1.authenticateToken);
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const pool = await db.connect();
        const request = pool.request();
        const result = await request.query(`
      SELECT 
        p.ProjectID,
        p.ProjectName,
        p.Description,
        p.IsActive,
        p.CreatedDate,
        p.ModifiedDate,
        u.FirstName + ' ' + u.LastName as CreatedBy,
        (SELECT COUNT(*) FROM Issues WHERE ProjectID = p.ProjectID) as IssueCount
      FROM Projects p
      INNER JOIN Users u ON p.CreatedByUserID = u.UserID
      WHERE p.IsActive = 1
      ORDER BY p.CreatedDate DESC
    `);
        const response = {
            success: true,
            data: result.recordset
        };
        res.json(response);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)('Failed to fetch projects', 500);
    }
}));
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
        throw (0, errorHandler_1.createError)('Invalid project ID', 400);
    }
    try {
        const pool = await db.connect();
        const request = pool.request();
        request.input('ProjectID', mssql_1.default.Int, projectId);
        const result = await request.query(`
      SELECT 
        p.ProjectID,
        p.ProjectName,
        p.Description,
        p.IsActive,
        p.CreatedDate,
        p.ModifiedDate,
        u.FirstName + ' ' + u.LastName as CreatedBy,
        (SELECT COUNT(*) FROM Issues WHERE ProjectID = p.ProjectID) as IssueCount,
        (SELECT COUNT(*) FROM Issues WHERE ProjectID = p.ProjectID AND Status = 'Open') as OpenIssues,
        (SELECT COUNT(*) FROM Issues WHERE ProjectID = p.ProjectID AND Status = 'In Progress') as InProgressIssues,
        (SELECT COUNT(*) FROM Issues WHERE ProjectID = p.ProjectID AND Status = 'Resolved') as ResolvedIssues,
        (SELECT COUNT(*) FROM Issues WHERE ProjectID = p.ProjectID AND Status = 'Closed') as ClosedIssues
      FROM Projects p
      INNER JOIN Users u ON p.CreatedByUserID = u.UserID
      WHERE p.ProjectID = @ProjectID AND p.IsActive = 1
    `);
        if (!result.recordset || result.recordset.length === 0) {
            throw (0, errorHandler_1.createError)('Project not found', 404);
        }
        const response = {
            success: true,
            data: result.recordset[0]
        };
        res.json(response);
    }
    catch (error) {
        if (error.statusCode === 404) {
            throw error;
        }
        throw (0, errorHandler_1.createError)('Failed to fetch project', 500);
    }
}));
router.post('/', (0, auth_1.authorizeRoles)('Admin', 'Developer'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { ProjectName, Description } = req.body;
    if (!ProjectName || ProjectName.trim().length === 0) {
        throw (0, errorHandler_1.createError)('Project name is required', 400);
    }
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        const pool = await db.connect();
        const request = pool.request();
        request.input('ProjectName', mssql_1.default.NVarChar(100), ProjectName.trim());
        request.input('Description', mssql_1.default.NVarChar(500), Description?.trim() || null);
        request.input('CreatedByUserID', mssql_1.default.Int, req.user.userId);
        const result = await request.query(`
      INSERT INTO Projects (ProjectName, Description, CreatedByUserID)
      VALUES (@ProjectName, @Description, @CreatedByUserID);
      SELECT SCOPE_IDENTITY() as ProjectID;
    `);
        const ProjectID = result.recordset[0].ProjectID;
        const response = {
            success: true,
            message: 'Project created successfully',
            data: { ProjectID, ProjectName, Description }
        };
        res.status(201).json(response);
    }
    catch (error) {
        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            throw (0, errorHandler_1.createError)('Project name already exists', 409);
        }
        throw (0, errorHandler_1.createError)('Failed to create project', 500);
    }
}));
router.put('/:id', (0, auth_1.authorizeRoles)('Admin', 'Developer'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const projectId = parseInt(id);
    const { ProjectName, Description } = req.body;
    if (isNaN(projectId)) {
        throw (0, errorHandler_1.createError)('Invalid project ID', 400);
    }
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        const pool = await db.connect();
        const request = pool.request();
        request.input('ProjectID', mssql_1.default.Int, projectId);
        request.input('ProjectName', mssql_1.default.NVarChar(100), ProjectName?.trim());
        request.input('Description', mssql_1.default.NVarChar(500), Description?.trim());
        const result = await request.query(`
      UPDATE Projects 
      SET 
        ProjectName = ISNULL(@ProjectName, ProjectName),
        Description = ISNULL(@Description, Description),
        ModifiedDate = GETDATE()
      WHERE ProjectID = @ProjectID AND IsActive = 1;
      SELECT @@ROWCOUNT as RowsAffected;
    `);
        if (result.recordset[0].RowsAffected === 0) {
            throw (0, errorHandler_1.createError)('Project not found', 404);
        }
        const response = {
            success: true,
            message: 'Project updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        if (error.statusCode === 404) {
            throw error;
        }
        throw (0, errorHandler_1.createError)('Failed to update project', 500);
    }
}));
router.delete('/:id', (0, auth_1.authorizeRoles)('Admin'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
        throw (0, errorHandler_1.createError)('Invalid project ID', 400);
    }
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        const pool = await db.connect();
        const request = pool.request();
        request.input('ProjectID', mssql_1.default.Int, projectId);
        const result = await request.query(`
      UPDATE Projects 
      SET IsActive = 0, ModifiedDate = GETDATE()
      WHERE ProjectID = @ProjectID AND IsActive = 1;
      SELECT @@ROWCOUNT as RowsAffected;
    `);
        if (result.recordset[0].RowsAffected === 0) {
            throw (0, errorHandler_1.createError)('Project not found', 404);
        }
        const response = {
            success: true,
            message: 'Project deactivated successfully'
        };
        res.json(response);
    }
    catch (error) {
        if (error.statusCode === 404) {
            throw error;
        }
        throw (0, errorHandler_1.createError)('Failed to deactivate project', 500);
    }
}));
exports.default = router;
//# sourceMappingURL=projects.js.map