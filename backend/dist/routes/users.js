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
    const { role, isActive, pageNumber = 1, pageSize = 50 } = req.query;
    try {
        const pool = await db.connect();
        const request = pool.request();
        request.input('Role', mssql_1.default.NVarChar(20), role || null);
        request.input('IsActive', mssql_1.default.Bit, isActive !== undefined ? isActive : null);
        request.input('PageNumber', mssql_1.default.Int, pageNumber);
        request.input('PageSize', mssql_1.default.Int, pageSize);
        const result = await request.execute('sp_GetAllUsers');
        const users = result.recordset || [];
        const totalRecords = users.length > 0 ? users[0].TotalRecords : 0;
        const totalPages = Math.ceil(totalRecords / Number(pageSize));
        const response = {
            success: true,
            data: {
                data: users,
                totalRecords,
                pageNumber: Number(pageNumber),
                pageSize: Number(pageSize),
                totalPages
            }
        };
        res.json(response);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)('Failed to fetch users', 500);
    }
}));
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
        throw (0, errorHandler_1.createError)('Invalid user ID', 400);
    }
    try {
        const result = await db.executeProcedure('sp_GetUserByID', { UserID: userId });
        if (!result.recordset || result.recordset.length === 0) {
            throw (0, errorHandler_1.createError)('User not found', 404);
        }
        const user = result.recordset[0];
        const response = {
            success: true,
            data: user
        };
        res.json(response);
    }
    catch (error) {
        if (error.statusCode === 404) {
            throw error;
        }
        throw (0, errorHandler_1.createError)('Failed to fetch user', 500);
    }
}));
router.put('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const userId = parseInt(id);
    const { FirstName, LastName, Email, Role, IsActive } = req.body;
    if (isNaN(userId)) {
        throw (0, errorHandler_1.createError)('Invalid user ID', 400);
    }
    const isAdmin = req.user.role === 'Admin';
    const isSelfUpdate = req.user.userId === userId;
    if (!isAdmin && !isSelfUpdate) {
        throw (0, errorHandler_1.createError)('Insufficient permissions', 403);
    }
    if (!isAdmin && (Role !== undefined || IsActive !== undefined)) {
        throw (0, errorHandler_1.createError)('Only administrators can update role and active status', 403);
    }
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        const pool = await db.connect();
        const request = pool.request();
        request.input('UserID', mssql_1.default.Int, userId);
        request.input('FirstName', mssql_1.default.NVarChar(50), FirstName || null);
        request.input('LastName', mssql_1.default.NVarChar(50), LastName || null);
        request.input('Email', mssql_1.default.NVarChar(100), Email || null);
        request.input('Role', mssql_1.default.NVarChar(20), isAdmin ? (Role || null) : null);
        request.input('IsActive', mssql_1.default.Bit, isAdmin ? (IsActive !== undefined ? IsActive : null) : null);
        request.input('ModifiedByUserID', mssql_1.default.Int, req.user.userId);
        await request.execute('sp_UpdateUser');
        const response = {
            success: true,
            message: 'User updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        if (error.message.includes('User not found')) {
            throw (0, errorHandler_1.createError)('User not found', 404);
        }
        else if (error.message.includes('Username already exists')) {
            throw (0, errorHandler_1.createError)('Username already exists', 409);
        }
        else if (error.message.includes('Email already exists')) {
            throw (0, errorHandler_1.createError)('Email already exists', 409);
        }
        throw (0, errorHandler_1.createError)('Failed to update user', 500);
    }
}));
router.delete('/:id', (0, auth_1.authorizeRoles)('Admin'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
        throw (0, errorHandler_1.createError)('Invalid user ID', 400);
    }
    if (req.user.userId === userId) {
        throw (0, errorHandler_1.createError)('Cannot deactivate your own account', 400);
    }
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        await db.executeProcedure('sp_UpdateUser', {
            UserID: userId,
            IsActive: false,
            ModifiedByUserID: req.user.userId
        });
        const response = {
            success: true,
            message: 'User deactivated successfully'
        };
        res.json(response);
    }
    catch (error) {
        if (error.message.includes('User not found')) {
            throw (0, errorHandler_1.createError)('User not found', 404);
        }
        throw (0, errorHandler_1.createError)('Failed to deactivate user', 500);
    }
}));
router.get('/assignable/list', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const pool = await db.connect();
        const request = pool.request();
        const result = await request.query(`
      SELECT 
        UserID,
        Username,
        FirstName + ' ' + LastName as FullName,
        Role
      FROM Users 
      WHERE IsActive = 1 
        AND Role IN ('Developer', 'Tester', 'Admin')
      ORDER BY FirstName, LastName
    `);
        const response = {
            success: true,
            data: result.recordset
        };
        res.json(response);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)('Failed to fetch assignable users', 500);
    }
}));
exports.default = router;
//# sourceMappingURL=users.js.map