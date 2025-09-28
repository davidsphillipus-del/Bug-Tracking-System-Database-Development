"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const mssql_1 = __importDefault(require("mssql"));
const db = database_1.default.getInstance();
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { Username, Email, Password, FirstName, LastName, Role } = req.body;
    if (!Username || !Email || !Password || !FirstName || !LastName || !Role) {
        throw (0, errorHandler_1.createError)('All fields are required', 400);
    }
    const validRoles = ['Admin', 'Developer', 'Tester', 'Reporter'];
    if (!validRoles.includes(Role)) {
        throw (0, errorHandler_1.createError)('Invalid role specified', 400);
    }
    const saltRounds = 12;
    const PasswordHash = await bcryptjs_1.default.hash(Password, saltRounds);
    try {
        await db.setSessionContext('CurrentUserID', '1');
        const pool = await db.connect();
        const request = pool.request();
        request.input('Username', mssql_1.default.NVarChar(50), Username);
        request.input('Email', mssql_1.default.NVarChar(100), Email);
        request.input('PasswordHash', mssql_1.default.NVarChar(255), PasswordHash);
        request.input('FirstName', mssql_1.default.NVarChar(50), FirstName);
        request.input('LastName', mssql_1.default.NVarChar(50), LastName);
        request.input('Role', mssql_1.default.NVarChar(20), Role);
        request.input('CreatedByUserID', mssql_1.default.Int, 1);
        request.output('UserID', mssql_1.default.Int);
        const result = await request.execute('sp_CreateUser');
        const UserID = result.output.UserID;
        if (!UserID) {
            throw (0, errorHandler_1.createError)('Failed to create user', 500);
        }
        const response = {
            success: true,
            message: 'User registered successfully',
            data: { UserID, Username, Email, FirstName, LastName, Role }
        };
        res.status(201).json(response);
    }
    catch (error) {
        if (error.message.includes('Username already exists')) {
            throw (0, errorHandler_1.createError)('Username already exists', 409);
        }
        else if (error.message.includes('Email already exists')) {
            throw (0, errorHandler_1.createError)('Email already exists', 409);
        }
        throw error;
    }
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { Username, Password } = req.body;
    if (!Username || !Password) {
        throw (0, errorHandler_1.createError)('Username and password are required', 400);
    }
    try {
        const result = await db.executeProcedure('sp_GetUserByUsername', { Username });
        if (!result.recordset || result.recordset.length === 0) {
            throw (0, errorHandler_1.createError)('Invalid credentials', 401);
        }
        const user = result.recordset[0];
        if (!user.IsActive) {
            throw (0, errorHandler_1.createError)('Account is deactivated', 401);
        }
        const isValidPassword = await bcryptjs_1.default.compare(Password, user.PasswordHash);
        if (!isValidPassword) {
            throw (0, errorHandler_1.createError)('Invalid credentials', 401);
        }
        await db.executeProcedure('sp_UpdateLastLogin', { UserID: user.UserID });
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw (0, errorHandler_1.createError)('JWT configuration error', 500);
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user.UserID,
            username: user.Username,
            role: user.Role
        }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        const { PasswordHash, ...userWithoutPassword } = user;
        const response = {
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token
            }
        };
        res.json(response);
    }
    catch (error) {
        if (error.statusCode === 401) {
            throw error;
        }
        throw (0, errorHandler_1.createError)('Login failed', 500);
    }
});
exports.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    try {
        const result = await db.executeProcedure('sp_GetUserByID', { UserID: req.user.userId });
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
        throw (0, errorHandler_1.createError)('Failed to fetch user profile', 500);
    }
});
exports.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { FirstName, LastName, Email } = req.body;
    try {
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        await db.executeProcedure('sp_UpdateUser', {
            UserID: req.user.userId,
            FirstName,
            LastName,
            Email,
            ModifiedByUserID: req.user.userId
        });
        const response = {
            success: true,
            message: 'Profile updated successfully'
        };
        res.json(response);
    }
    catch (error) {
        if (error.message.includes('Email already exists')) {
            throw (0, errorHandler_1.createError)('Email already exists', 409);
        }
        throw (0, errorHandler_1.createError)('Failed to update profile', 500);
    }
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw (0, errorHandler_1.createError)('Current password and new password are required', 400);
    }
    if (newPassword.length < 6) {
        throw (0, errorHandler_1.createError)('New password must be at least 6 characters long', 400);
    }
    try {
        const userResult = await db.executeProcedure('sp_GetUserByID', { UserID: req.user.userId });
        if (!userResult.recordset || userResult.recordset.length === 0) {
            throw (0, errorHandler_1.createError)('User not found', 404);
        }
        const user = userResult.recordset[0];
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.PasswordHash);
        if (!isValidPassword) {
            throw (0, errorHandler_1.createError)('Current password is incorrect', 400);
        }
        const saltRounds = 12;
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, saltRounds);
        await db.setSessionContext('CurrentUserID', req.user.userId.toString());
        const pool = await db.connect();
        const request = pool.request();
        request.input('UserID', mssql_1.default.Int, req.user.userId);
        request.input('PasswordHash', mssql_1.default.NVarChar(255), newPasswordHash);
        await request.query(`
      UPDATE Users 
      SET PasswordHash = @PasswordHash, ModifiedDate = GETDATE()
      WHERE UserID = @UserID
    `);
        const response = {
            success: true,
            message: 'Password changed successfully'
        };
        res.json(response);
    }
    catch (error) {
        if (error.statusCode) {
            throw error;
        }
        throw (0, errorHandler_1.createError)('Failed to change password', 500);
    }
});
//# sourceMappingURL=authController.js.map