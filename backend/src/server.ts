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
    PasswordHash: 'password', // plain text for demo
    FirstName: 'Admin',
    LastName: 'User',
    Role: 'Admin'
  },
  {
    UserID: 2,
    Username: 'john.dev',
    PasswordHash: 'password', // plain text for demo
    FirstName: 'John',
    LastName: 'Smith',
    Role: 'Developer'
  },
  {
    UserID: 3,
    Username: 'jane.tester',
    PasswordHash: 'password', // plain text for demo
    FirstName: 'Jane',
    LastName: 'Wilson',
    Role: 'Tester'
  },
  {
    UserID: 4,
    Username: 'mike.reporter',
    PasswordHash: 'password', // plain text for demo
    FirstName: 'Mike',
    LastName: 'Johnson',
    Role: 'Reporter'
  },
  {
    UserID: 5,
    Username: 'sarah.dev',
    PasswordHash: 'password', // plain text for demo
    FirstName: 'Sarah',
    LastName: 'Davis',
    Role: 'Developer'
  },
  {
    UserID: 6,
    Username: 'alex.tester',
    PasswordHash: 'password', // plain text for demo
    FirstName: 'Alex',
    LastName: 'Brown',
    Role: 'Tester'
  },
  {
    UserID: 7,
    Username: 'lisa.manager',
    PasswordHash: 'password', // plain text for demo
    FirstName: 'Lisa',
    LastName: 'Garcia',
    Role: 'Admin'
  },
  {
    UserID: 8,
    Username: 'tom.dev',
    PasswordHash: 'password', // plain text for demo
    FirstName: 'Tom',
    LastName: 'Miller',
    Role: 'Developer'
  },
  {
    UserID: 9,
    Username: 'emma.reporter',
    PasswordHash: 'password', // plain text for demo
    FirstName: 'Emma',
    LastName: 'Taylor',
    Role: 'Reporter'
  },
  {
    UserID: 10,
    Username: 'david.tester',
    PasswordHash: 'password', // plain text for demo
    FirstName: 'David',
    LastName: 'Anderson',
    Role: 'Tester'
  }
];

const dummyProjects = [
  { ProjectID: 1, ProjectName: 'E-Commerce Platform', Description: 'Main e-commerce web application with shopping cart and payment integration' },
  { ProjectID: 2, ProjectName: 'Mobile Banking App', Description: 'iOS and Android banking application with biometric authentication' },
  { ProjectID: 3, ProjectName: 'Customer API Gateway', Description: 'RESTful API service for customer data management and integration' },
  { ProjectID: 4, ProjectName: 'Analytics Dashboard', Description: 'Real-time business intelligence and reporting dashboard' },
  { ProjectID: 5, ProjectName: 'Inventory Management', Description: 'Warehouse and inventory tracking system with barcode scanning' },
  { ProjectID: 6, ProjectName: 'HR Portal', Description: 'Employee self-service portal for HR processes and document management' },
  { ProjectID: 7, ProjectName: 'CRM System', Description: 'Customer relationship management system with sales pipeline tracking' },
  { ProjectID: 8, ProjectName: 'Security Framework', Description: 'Enterprise security framework with SSO and access control' }
];

let dummyIssues = [
  {
    IssueID: 1,
    ProjectID: 1,
    Title: 'Shopping cart items disappear on page refresh',
    Description: 'When users refresh the page, all items in their shopping cart are lost. This affects user experience and potential sales.',
    IssueType: 'Bug',
    Priority: 'High',
    Status: 'Open',
    ReporterUserID: 9,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'E-Commerce Platform',
    ReporterName: 'Emma Taylor',
    AssignedToName: 'John Smith' as string | null
  },
  {
    IssueID: 2,
    ProjectID: 1,
    Title: 'Implement wishlist functionality',
    Description: 'Users want to save products to a wishlist for future purchase. Need to add wishlist feature with user authentication.',
    IssueType: 'Feature',
    Priority: 'Medium',
    Status: 'In Progress',
    ReporterUserID: 4,
    AssignedToUserID: 5 as number | null,
    ProjectName: 'E-Commerce Platform',
    ReporterName: 'Mike Johnson',
    AssignedToName: 'Sarah Davis' as string | null
  },
  {
    IssueID: 3,
    ProjectID: 2,
    Title: 'Biometric authentication fails on iPhone 12',
    Description: 'Face ID authentication is not working properly on iPhone 12 devices. Users cannot login using biometric authentication.',
    IssueType: 'Bug',
    Priority: 'Critical',
    Status: 'Open',
    ReporterUserID: 6,
    AssignedToUserID: 8 as number | null,
    ProjectName: 'Mobile Banking App',
    ReporterName: 'Alex Brown',
    AssignedToName: 'Tom Miller' as string | null
  },
  {
    IssueID: 4,
    ProjectID: 3,
    Title: 'API rate limiting implementation',
    Description: 'Need to implement rate limiting to prevent API abuse and ensure fair usage across all clients.',
    IssueType: 'Enhancement',
    Priority: 'High',
    Status: 'Testing',
    ReporterUserID: 7,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'Customer API Gateway',
    ReporterName: 'Lisa Garcia',
    AssignedToName: 'John Smith' as string | null
  },
  {
    IssueID: 5,
    ProjectID: 4,
    Title: 'Dashboard loading performance issues',
    Description: 'Analytics dashboard takes too long to load when displaying large datasets. Need to optimize queries and implement caching.',
    IssueType: 'Bug',
    Priority: 'Medium',
    Status: 'Resolved',
    ReporterUserID: 1,
    AssignedToUserID: 5 as number | null,
    ProjectName: 'Analytics Dashboard',
    ReporterName: 'Admin User',
    AssignedToName: 'Sarah Davis' as string | null
  },
  {
    IssueID: 6,
    ProjectID: 1,
    Title: 'Payment gateway integration error',
    Description: 'Credit card payments are failing with error code 500. Integration with payment processor needs debugging.',
    IssueType: 'Bug',
    Priority: 'Critical',
    Status: 'In Progress',
    ReporterUserID: 3,
    AssignedToUserID: 8 as number | null,
    ProjectName: 'E-Commerce Platform',
    ReporterName: 'Jane Wilson',
    AssignedToName: 'Tom Miller' as string | null
  },
  {
    IssueID: 7,
    ProjectID: 5,
    Title: 'Barcode scanner not working on Android tablets',
    Description: 'The barcode scanning feature fails to initialize camera on Android tablet devices in the warehouse.',
    IssueType: 'Bug',
    Priority: 'High',
    Status: 'Open',
    ReporterUserID: 4,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'Inventory Management',
    ReporterName: 'Mike Johnson',
    AssignedToName: 'John Smith' as string | null
  },
  {
    IssueID: 8,
    ProjectID: 6,
    Title: 'Add employee document upload feature',
    Description: 'HR needs functionality for employees to upload documents like tax forms, certificates, and personal documents.',
    IssueType: 'Feature',
    Priority: 'Medium',
    Status: 'Open',
    ReporterUserID: 7,
    AssignedToUserID: 5 as number | null,
    ProjectName: 'HR Portal',
    ReporterName: 'Lisa Garcia',
    AssignedToName: 'Sarah Davis' as string | null
  },
  {
    IssueID: 9,
    ProjectID: 7,
    Title: 'Email notifications not sending',
    Description: 'Automated email notifications for lead updates and follow-ups are not being sent to sales team members.',
    IssueType: 'Bug',
    Priority: 'High',
    Status: 'Testing',
    ReporterUserID: 9,
    AssignedToUserID: 8 as number | null,
    ProjectName: 'CRM System',
    ReporterName: 'Emma Taylor',
    AssignedToName: 'Tom Miller' as string | null
  },
  {
    IssueID: 10,
    ProjectID: 8,
    Title: 'Implement multi-factor authentication',
    Description: 'Security requirement to add MFA for all admin users accessing the security framework configuration.',
    IssueType: 'Feature',
    Priority: 'High',
    Status: 'In Progress',
    ReporterUserID: 1,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'Security Framework',
    ReporterName: 'Admin User',
    AssignedToName: 'John Smith' as string | null
  },
  {
    IssueID: 11,
    ProjectID: 2,
    Title: 'Transaction history export feature',
    Description: 'Users need ability to export their transaction history as PDF or CSV for tax purposes and record keeping.',
    IssueType: 'Feature',
    Priority: 'Medium',
    Status: 'Open',
    ReporterUserID: 10,
    AssignedToUserID: 5 as number | null,
    ProjectName: 'Mobile Banking App',
    ReporterName: 'David Anderson',
    AssignedToName: 'Sarah Davis' as string | null
  },
  {
    IssueID: 12,
    ProjectID: 3,
    Title: 'API documentation outdated',
    Description: 'The API documentation does not reflect recent changes to endpoints and response formats. Developers are confused.',
    IssueType: 'Bug',
    Priority: 'Medium',
    Status: 'Open',
    ReporterUserID: 2,
    AssignedToUserID: null as number | null,
    ProjectName: 'Customer API Gateway',
    ReporterName: 'John Smith',
    AssignedToName: null as string | null
  },
  {
    IssueID: 13,
    ProjectID: 4,
    Title: 'Real-time data refresh not working',
    Description: 'Dashboard charts and metrics are not updating in real-time. Users have to manually refresh to see latest data.',
    IssueType: 'Bug',
    Priority: 'High',
    Status: 'In Progress',
    ReporterUserID: 7,
    AssignedToUserID: 8 as number | null,
    ProjectName: 'Analytics Dashboard',
    ReporterName: 'Lisa Garcia',
    AssignedToName: 'Tom Miller' as string | null
  },
  {
    IssueID: 14,
    ProjectID: 5,
    Title: 'Low stock alert notifications',
    Description: 'System should automatically notify managers when inventory levels fall below minimum threshold.',
    IssueType: 'Feature',
    Priority: 'High',
    Status: 'Testing',
    ReporterUserID: 4,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'Inventory Management',
    ReporterName: 'Mike Johnson',
    AssignedToName: 'John Smith' as string | null
  },
  {
    IssueID: 15,
    ProjectID: 6,
    Title: 'Password reset functionality broken',
    Description: 'Employees cannot reset their passwords through the self-service portal. Reset emails are not being sent.',
    IssueType: 'Bug',
    Priority: 'Critical',
    Status: 'Open',
    ReporterUserID: 6,
    AssignedToUserID: 8 as number | null,
    ProjectName: 'HR Portal',
    ReporterName: 'Alex Brown',
    AssignedToName: 'Tom Miller' as string | null
  },
  {
    IssueID: 16,
    ProjectID: 7,
    Title: 'Sales pipeline visualization improvements',
    Description: 'Current pipeline view is confusing. Need better visual representation of deal stages and probability.',
    IssueType: 'Enhancement',
    Priority: 'Medium',
    Status: 'Open',
    ReporterUserID: 9,
    AssignedToUserID: 5 as number | null,
    ProjectName: 'CRM System',
    ReporterName: 'Emma Taylor',
    AssignedToName: 'Sarah Davis' as string | null
  },
  {
    IssueID: 17,
    ProjectID: 8,
    Title: 'Session timeout too aggressive',
    Description: 'Users are being logged out too frequently due to short session timeout. Need to adjust timeout settings.',
    IssueType: 'Bug',
    Priority: 'Medium',
    Status: 'Resolved',
    ReporterUserID: 3,
    AssignedToUserID: 2 as number | null,
    ProjectName: 'Security Framework',
    ReporterName: 'Jane Wilson',
    AssignedToName: 'John Smith' as string | null
  },
  {
    IssueID: 18,
    ProjectID: 1,
    Title: 'Product search functionality enhancement',
    Description: 'Search results are not relevant. Need to implement better search algorithm with filters and sorting options.',
    IssueType: 'Enhancement',
    Priority: 'High',
    Status: 'In Progress',
    ReporterUserID: 10,
    AssignedToUserID: 5 as number | null,
    ProjectName: 'E-Commerce Platform',
    ReporterName: 'David Anderson',
    AssignedToName: 'Sarah Davis' as string | null
  },
  {
    IssueID: 19,
    ProjectID: 2,
    Title: 'Push notifications not working on iOS',
    Description: 'Push notifications for account alerts and transaction confirmations are not appearing on iOS devices.',
    IssueType: 'Bug',
    Priority: 'High',
    Status: 'Open',
    ReporterUserID: 3,
    AssignedToUserID: 8 as number | null,
    ProjectName: 'Mobile Banking App',
    ReporterName: 'Jane Wilson',
    AssignedToName: 'Tom Miller' as string | null
  },
  {
    IssueID: 20,
    ProjectID: 4,
    Title: 'Add custom dashboard widgets',
    Description: 'Users want ability to create custom widgets and arrange dashboard layout according to their preferences.',
    IssueType: 'Feature',
    Priority: 'Low',
    Status: 'Open',
    ReporterUserID: 1,
    AssignedToUserID: null as number | null,
    ProjectName: 'Analytics Dashboard',
    ReporterName: 'Admin User',
    AssignedToName: null as string | null
  }
];

let nextIssueId = 21;
let nextUserId = 11;

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

    // Check password (plain text for demo)
    if (Password !== user.PasswordHash) {
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
  console.log('🔑 Demo credentials (all use "password"):');
  console.log('   • admin (Admin) • john.dev (Developer) • jane.tester (Tester)');
  console.log('   • mike.reporter (Reporter) • sarah.dev (Developer) • alex.tester (Tester)');
  console.log('   • lisa.manager (Admin) • tom.dev (Developer) • emma.reporter (Reporter)');
  console.log('   • david.tester (Tester)');
  console.log(`📊 Demo data: ${dummyUsers.length} users, ${dummyProjects.length} projects, ${dummyIssues.length} issues`);
});
