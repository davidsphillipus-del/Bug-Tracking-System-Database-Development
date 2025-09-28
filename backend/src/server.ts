// Bug Tracking System Backend Server
// Express.js server with dummy data for demonstration

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Demo mode - using dummy data instead of database

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
const PORT = 5000;
const JWT_SECRET = 'demo-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Dummy data for demonstration
const dummyUsers = [
  {
    UserID: 1,
    Username: 'admin',
    PasswordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    FirstName: 'Admin',
    LastName: 'User',
    Role: 'Admin'
  },
  {
    UserID: 2,
    Username: 'john.dev',
    PasswordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    FirstName: 'John',
    LastName: 'Developer',
    Role: 'Developer'
  },
  {
    UserID: 3,
    Username: 'jane.tester',
    PasswordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    FirstName: 'Jane',
    LastName: 'Tester',
    Role: 'Tester'
  },
  {
    UserID: 4,
    Username: 'mike.reporter',
    PasswordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    FirstName: 'Mike',
    LastName: 'Reporter',
    Role: 'Reporter'
  }
];

const dummyProjects = [
  { ProjectID: 1, ProjectName: 'Web Application', Description: 'Main web application project' },
  { ProjectID: 2, ProjectName: 'Mobile App', Description: 'Mobile application development' },
  { ProjectID: 3, ProjectName: 'API Service', Description: 'Backend API service' },
  { ProjectID: 4, ProjectName: 'Database System', Description: 'Database management system' }
];

let dummyIssues = [
  {
    IssueID: 1,
    ProjectID: 1,
    Title: 'Login page not responsive',
    Description: 'The login page does not display correctly on mobile devices',
    IssueType: 'Bug',
    Priority: 'High',
    Status: 'Open',
    ReporterUserID: 4,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'Web Application',
    ReporterName: 'Mike Reporter',
    AssignedToName: 'John Developer' as string | null
  },
  {
    IssueID: 2,
    ProjectID: 1,
    Title: 'Add dark mode feature',
    Description: 'Users have requested a dark mode option for the application',
    IssueType: 'Feature',
    Priority: 'Medium',
    Status: 'In Progress',
    ReporterUserID: 1,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'Web Application',
    ReporterName: 'Admin User',
    AssignedToName: 'John Developer' as string | null
  },
  {
    IssueID: 3,
    ProjectID: 2,
    Title: 'App crashes on startup',
    Description: 'Mobile app crashes immediately after opening on Android devices',
    IssueType: 'Bug',
    Priority: 'Critical',
    Status: 'Open',
    ReporterUserID: 3,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'Mobile App',
    ReporterName: 'Jane Tester',
    AssignedToName: 'John Developer' as string | null
  },
  {
    IssueID: 4,
    ProjectID: 3,
    Title: 'Improve API response time',
    Description: 'API endpoints are responding slowly, need optimization',
    IssueType: 'Enhancement',
    Priority: 'Medium',
    Status: 'Testing',
    ReporterUserID: 2,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'API Service',
    ReporterName: 'John Developer',
    AssignedToName: 'John Developer' as string | null
  },
  {
    IssueID: 5,
    ProjectID: 1,
    Title: 'User registration validation',
    Description: 'Add better validation for user registration form',
    IssueType: 'Enhancement',
    Priority: 'Low',
    Status: 'Resolved',
    ReporterUserID: 1,
    AssignedToUserID: 3 as number | null,
    ProjectName: 'Web Application',
    ReporterName: 'Admin User',
    AssignedToName: 'Jane Tester' as string | null
  }
];

let nextIssueId = 6;
let nextUserId = 5;

// JWT Authentication middleware
const auth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid token.' });
    return;
  }
};

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bug Tracking API is running (Demo Mode)',
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
    const existingUser = dummyUsers.find(u => u.Username === Username);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Add new user to dummy data
    const newUser = {
      UserID: nextUserId++,
      Username,
      PasswordHash: hashedPassword,
      FirstName,
      LastName,
      Role: Role || 'Reporter'
    };
    
    dummyUsers.push(newUser);

    return res.json({ 
      success: true, 
      message: 'User registered successfully',
      userId: newUser.UserID
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

    // Find user in dummy data
    const user = dummyUsers.find(u => u.Username === Username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(Password, user.PasswordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.UserID, username: user.Username, role: user.Role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        UserID: user.UserID,
        Username: user.Username,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Role: user.Role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Get all issues
app.get('/api/issues', auth, (req, res) => {
  try {
    return res.json({
      success: true,
      issues: dummyIssues
    });
  } catch (error) {
    console.error('Get issues error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch issues' });
  }
});

// Create new issue
app.post('/api/issues', auth, (req, res) => {
  try {
    const { ProjectID, Title, Description, IssueType, Priority, AssignedToUserID } = req.body;

    if (!ProjectID || !Title || !Description) {
      return res.status(400).json({ success: false, error: 'ProjectID, Title, and Description are required' });
    }

    const project = dummyProjects.find(p => p.ProjectID === parseInt(ProjectID));
    const assignedUser = AssignedToUserID ? dummyUsers.find(u => u.UserID === parseInt(AssignedToUserID)) : null;
    const reporter = dummyUsers.find(u => u.UserID === req.user?.userId);

    const newIssue = {
      IssueID: nextIssueId++,
      ProjectID: parseInt(ProjectID),
      Title,
      Description,
      IssueType: IssueType || 'Bug',
      Priority: Priority || 'Medium',
      Status: 'Open',
      ReporterUserID: req.user?.userId || 1,
      AssignedToUserID: AssignedToUserID ? parseInt(AssignedToUserID) : null,
      ProjectName: project?.ProjectName || 'Unknown Project',
      ReporterName: reporter ? `${reporter.FirstName} ${reporter.LastName}` : 'Unknown Reporter',
      AssignedToName: (assignedUser ? `${assignedUser.FirstName} ${assignedUser.LastName}` : null) as string | null
    };

    dummyIssues.push(newIssue);

    return res.json({
      success: true,
      message: 'Issue created successfully',
      issueId: newIssue.IssueID
    });

  } catch (error) {
    console.error('Create issue error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create issue' });
  }
});

// Update issue status
app.put('/api/issues/:id/status', auth, (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const { Status } = req.body;

    if (!Status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const issueIndex = dummyIssues.findIndex(i => i.IssueID === issueId);
    if (issueIndex === -1) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    dummyIssues[issueIndex].Status = Status;

    return res.json({
      success: true,
      message: 'Issue status updated successfully'
    });

  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update issue status' });
  }
});

// Get all projects
app.get('/api/projects', auth, (req, res) => {
  try {
    return res.json({
      success: true,
      projects: dummyProjects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// Get all users
app.get('/api/users', auth, (req, res) => {
  try {
    const users = dummyUsers.map(user => ({
      UserID: user.UserID,
      Username: user.Username,
      FirstName: user.FirstName,
      LastName: user.LastName,
      Role: user.Role
    }));

    return res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

console.log('🚀 Bug Tracking API Server starting in Demo Mode...');
console.log('📊 Using dummy data instead of database');

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log('🔑 Demo credentials: admin/password, john.dev/password, jane.tester/password');
});
