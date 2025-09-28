"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mssql_1 = __importDefault(require("mssql"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const dbConfig = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'BugTrackingSystem',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourPassword123!',
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};
let pool;
const connectDB = async () => {
    try {
        pool = await mssql_1.default.connect(dbConfig);
        console.log('✅ Connected to SQL Server');
        return true;
    }
    catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }
};
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, error: 'No token provided' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Invalid token' });
        return;
    }
};
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Bug Tracking API is running',
        timestamp: new Date().toISOString()
    });
});
app.post('/api/auth/register', async (req, res) => {
    try {
        const { Username, Password, FirstName, LastName, Role } = req.body;
        if (!Username || !Password || !FirstName || !LastName) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }
        const existingUser = await pool.request()
            .input('Username', mssql_1.default.NVarChar, Username)
            .query('SELECT UserID FROM Users WHERE Username = @Username');
        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ success: false, error: 'Username already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(Password, 10);
        const result = await pool.request()
            .input('Username', mssql_1.default.NVarChar, Username)
            .input('PasswordHash', mssql_1.default.NVarChar, hashedPassword)
            .input('FirstName', mssql_1.default.NVarChar, FirstName)
            .input('LastName', mssql_1.default.NVarChar, LastName)
            .input('Role', mssql_1.default.NVarChar, Role || 'Reporter')
            .query(`
        INSERT INTO Users (Username, PasswordHash, FirstName, LastName, Role)
        VALUES (@Username, @PasswordHash, @FirstName, @LastName, @Role);
        SELECT SCOPE_IDENTITY() as UserID;
      `);
        const newUserId = result.recordset[0].UserID;
        return res.json({
            success: true,
            message: 'User registered successfully',
            userId: newUserId
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, error: 'Registration failed' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { Username, Password } = req.body;
        if (!Username || !Password) {
            return res.status(400).json({ success: false, error: 'Username and password required' });
        }
        const result = await pool.request()
            .input('Username', mssql_1.default.NVarChar, Username)
            .query('SELECT * FROM Users WHERE Username = @Username');
        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const user = result.recordset[0];
        const valid = await bcryptjs_1.default.compare(Password, user.PasswordHash);
        if (!valid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.UserID, username: user.Username, role: user.Role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        const { PasswordHash, ...userWithoutPassword } = user;
        return res.json({
            success: true,
            data: { user: userWithoutPassword, token }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Login failed' });
    }
});
app.get('/api/issues', auth, async (req, res) => {
    try {
        const result = await pool.request().query(`
      SELECT
        i.IssueID,
        i.Title,
        i.Description,
        i.IssueType,
        i.Priority,
        i.Status,
        i.CreatedDate,
        p.ProjectName,
        COALESCE(u.FirstName + ' ' + u.LastName, 'Unassigned') as AssignedToName,
        reporter.FirstName + ' ' + reporter.LastName as ReporterName
      FROM Issues i
      INNER JOIN Projects p ON i.ProjectID = p.ProjectID
      INNER JOIN Users reporter ON i.ReporterUserID = reporter.UserID
      LEFT JOIN Users u ON i.AssignedToUserID = u.UserID
      ORDER BY i.CreatedDate DESC
    `);
        return res.json({
            success: true,
            data: {
                data: result.recordset,
                totalRecords: result.recordset.length,
                pageNumber: 1,
                pageSize: result.recordset.length,
                totalPages: 1
            }
        });
    }
    catch (error) {
        console.error('Get issues error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch issues' });
    }
});
app.post('/api/issues', auth, async (req, res) => {
    try {
        const { ProjectID, Title, Description, IssueType, Priority, AssignedToUserID } = req.body;
        const ReporterUserID = req.user?.userId;
        const result = await pool.request()
            .input('ProjectID', mssql_1.default.Int, ProjectID)
            .input('Title', mssql_1.default.NVarChar, Title)
            .input('Description', mssql_1.default.NVarChar, Description)
            .input('IssueType', mssql_1.default.NVarChar, IssueType)
            .input('Priority', mssql_1.default.NVarChar, Priority)
            .input('ReporterUserID', mssql_1.default.Int, ReporterUserID)
            .input('AssignedToUserID', mssql_1.default.Int, AssignedToUserID || null)
            .execute('sp_CreateIssue');
        return res.json({ success: true, data: { IssueID: result.recordset[0].IssueID } });
    }
    catch (error) {
        console.error('Create issue error:', error);
        return res.status(500).json({ success: false, error: 'Failed to create issue' });
    }
});
app.put('/api/issues/:id/status', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { NewStatus } = req.body;
        await pool.request()
            .input('IssueID', mssql_1.default.Int, id)
            .input('NewStatus', mssql_1.default.NVarChar, NewStatus)
            .execute('sp_UpdateStatus');
        return res.json({ success: true, message: 'Issue status updated' });
    }
    catch (error) {
        console.error('Update status error:', error);
        return res.status(500).json({ success: false, error: 'Failed to update status' });
    }
});
app.get('/api/projects', auth, async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM Projects ORDER BY ProjectName');
        return res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        console.error('Get projects error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
});
app.get('/api/users/assignable', auth, async (req, res) => {
    try {
        const result = await pool.request().query(`
      SELECT UserID, Username, FirstName, LastName, Role
      FROM Users
      WHERE Role IN ('Developer', 'Tester', 'Admin')
      ORDER BY FirstName, LastName
    `);
        return res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});
const startServer = async () => {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
};
startServer();
//# sourceMappingURL=server.js.map