// Bug Tracking System Backend Server
// Express.js server with SQL Server database integration

import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        role: string;
      };
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
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

let pool: sql.ConnectionPool;

// Connect to database
const connectDB = async () => {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to SQL Server');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
};

// Auth middleware
const auth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }
};

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bug Tracking API is running',
    timestamp: new Date().toISOString()
  });
});

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { Username, Password, FirstName, LastName, Role } = req.body;

    if (!Username || !Password || !FirstName || !LastName) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await pool.request()
      .input('Username', sql.NVarChar, Username)
      .query('SELECT UserID FROM Users WHERE Username = @Username');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Insert new user
    const result = await pool.request()
      .input('Username', sql.NVarChar, Username)
      .input('PasswordHash', sql.NVarChar, hashedPassword)
      .input('FirstName', sql.NVarChar, FirstName)
      .input('LastName', sql.NVarChar, LastName)
      .input('Role', sql.NVarChar, Role || 'Reporter')
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

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const result = await pool.request()
      .input('Username', sql.NVarChar, Username)
      .query('SELECT * FROM Users WHERE Username = @Username');

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.recordset[0];
    const valid = await bcrypt.compare(Password, user.PasswordHash);

    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.UserID, username: user.Username, role: user.Role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const { PasswordHash, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Get issues
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
  } catch (error) {
    console.error('Get issues error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch issues' });
  }
});

// Create new issue
app.post('/api/issues', auth, async (req, res) => {
  try {
    const { ProjectID, Title, Description, IssueType, Priority, AssignedToUserID } = req.body;
    const ReporterUserID = req.user?.userId;

    const result = await pool.request()
      .input('ProjectID', sql.Int, ProjectID)
      .input('Title', sql.NVarChar, Title)
      .input('Description', sql.NVarChar, Description)
      .input('IssueType', sql.NVarChar, IssueType)
      .input('Priority', sql.NVarChar, Priority)
      .input('ReporterUserID', sql.Int, ReporterUserID)
      .input('AssignedToUserID', sql.Int, AssignedToUserID || null)
      .execute('sp_CreateIssue');

    return res.json({ success: true, data: { IssueID: result.recordset[0].IssueID } });
  } catch (error) {
    console.error('Create issue error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create issue' });
  }
});

// Update issue status
app.put('/api/issues/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { NewStatus } = req.body;

    await pool.request()
      .input('IssueID', sql.Int, id)
      .input('NewStatus', sql.NVarChar, NewStatus)
      .execute('sp_UpdateStatus');

    return res.json({ success: true, message: 'Issue status updated' });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// Get projects
app.get('/api/projects', auth, async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Projects ORDER BY ProjectName');
    return res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// Get users for assignment
app.get('/api/users/assignable', auth, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT UserID, Username, FirstName, LastName, Role
      FROM Users
      WHERE Role IN ('Developer', 'Tester', 'Admin')
      ORDER BY FirstName, LastName
    `);
    return res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Start server
const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
};

startServer();
