import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface User {
  UserID: number;
  Username: string;
  FirstName: string;
  LastName: string;
  Role: string;
}

interface Issue {
  IssueID: number;
  Title: string;
  Description: string;
  Status: string;
  Priority: string;
  ProjectName: string;
  AssignedToName: string;
  ProjectID?: number;
}

interface Project {
  ProjectID: number;
  ProjectName: string;
}

interface AssignableUser {
  UserID: number;
  Username: string;
  FirstName: string;
  LastName: string;
  Role: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Registration form state
  const [registerData, setRegisterData] = useState({
    Username: '',
    Password: '',
    FirstName: '',
    LastName: '',
    Role: 'Reporter'
  });

  // Create issue form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIssue, setNewIssue] = useState({
    ProjectID: '',
    Title: '',
    Description: '',
    IssueType: 'Bug',
    Priority: 'Medium',
    AssignedToUserID: ''
  });

  // Login function
  const login = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        Username: username,
        Password: password
      });

      const { user: userData, token } = response.data;
      setUser(userData);
      localStorage.setItem('token', token);
      setCurrentPage('dashboard');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setCurrentPage('login');
  };

  // Register new user
  const register = async () => {
    if (!registerData.Username || !registerData.Password || !registerData.FirstName || !registerData.LastName) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/register`, registerData);

      if (response.data.success) {
        setError('');
        setShowRegister(false);
        setRegisterData({
          Username: '',
          Password: '',
          FirstName: '',
          LastName: '',
          Role: 'Reporter'
        });
        alert('Registration successful! You can now login.');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Load issues
  const loadIssues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/issues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIssues(response.data.issues);
    } catch (err) {
      console.error('Failed to load issues');
    }
  };

  // Load projects
  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data.projects);
    } catch (err) {
      console.error('Failed to load projects');
    }
  };

  // Load assignable users
  const loadAssignableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignableUsers(response.data.users);
    } catch (err) {
      console.error('Failed to load users');
    }
  };

  // Create new issue
  const createIssue = async () => {
    if (!newIssue.ProjectID || !newIssue.Title || !newIssue.Description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/issues`, {
        ProjectID: parseInt(newIssue.ProjectID),
        Title: newIssue.Title,
        Description: newIssue.Description,
        IssueType: newIssue.IssueType,
        Priority: newIssue.Priority,
        AssignedToUserID: newIssue.AssignedToUserID ? parseInt(newIssue.AssignedToUserID) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form and reload issues
      setNewIssue({
        ProjectID: '',
        Title: '',
        Description: '',
        IssueType: 'Bug',
        Priority: 'Medium',
        AssignedToUserID: ''
      });
      setShowCreateForm(false);
      setError('');
      await loadIssues();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create issue');
    }
    setLoading(false);
  };

  // Update issue status
  const updateIssueStatus = async (issueId: number, newStatus: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/issues/${issueId}/status`, {
        Status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await loadIssues(); // Reload to show updated status
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
    setLoading(false);
  };

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, verify token with server
      setCurrentPage('dashboard');
    }
  }, []);

  // Load data when needed
  useEffect(() => {
    if (currentPage === 'issues') {
      loadIssues();
    }
    if (currentPage === 'dashboard' || currentPage === 'issues') {
      loadProjects();
      loadAssignableUsers();
    }
  }, [currentPage]);

  // Login Page
  if (currentPage === 'login') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%',
          margin: '20px'
        }}>
          <h1 style={{
            textAlign: 'center',
            color: '#2d3748',
            marginBottom: '30px',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Bug Tracker
          </h1>

          {error && (
            <div style={{
              color: '#e53e3e',
              backgroundColor: '#fed7d7',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '20px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
            <button
              onClick={login}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
                marginBottom: '10px'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button
              onClick={() => setShowRegister(true)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#4a5568',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Create New Account
            </button>
          </div>

          <div style={{
            fontSize: '13px',
            color: '#718096',
            backgroundColor: '#f7fafc',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#4a5568' }}>
              Demo Credentials:
            </p>
            <p style={{ margin: '5px 0' }}>admin / password (Admin)</p>
            <p style={{ margin: '5px 0' }}>john.dev / password (Developer)</p>
            <p style={{ margin: '5px 0' }}>jane.tester / password (Tester)</p>
          </div>
        </div>

        {/* Registration Modal */}
        {showRegister && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h2 style={{
                color: '#2d3748',
                marginBottom: '20px',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Create New Account
              </h2>

              {error && (
                <div style={{
                  color: '#e53e3e',
                  backgroundColor: '#fed7d7',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4a5568' }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={registerData.Username}
                  onChange={(e) => setRegisterData({...registerData, Username: e.target.value})}
                  placeholder="Enter username..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4a5568' }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={registerData.Password}
                  onChange={(e) => setRegisterData({...registerData, Password: e.target.value})}
                  placeholder="Enter password..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4a5568' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={registerData.FirstName}
                    onChange={(e) => setRegisterData({...registerData, FirstName: e.target.value})}
                    placeholder="First name..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4a5568' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={registerData.LastName}
                    onChange={(e) => setRegisterData({...registerData, LastName: e.target.value})}
                    placeholder="Last name..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4a5568' }}>
                  Role
                </label>
                <select
                  value={registerData.Role}
                  onChange={(e) => setRegisterData({...registerData, Role: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="Reporter">Reporter</option>
                  <option value="Developer">Developer</option>
                  <option value="Tester">Tester</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setError('');
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#e2e8f0',
                    color: '#4a5568',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={register}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main App Layout
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Navigation */}
      <div style={{
        background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
        color: 'white',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
          Bug Tracking System
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setCurrentPage('dashboard')}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              backgroundColor: currentPage === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('issues')}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              backgroundColor: currentPage === 'issues' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            Issues
          </button>
          <div style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '6px',
            fontSize: '14px',
            marginRight: '10px'
          }}>
            {user?.FirstName} ({user?.Role})
          </div>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {currentPage === 'dashboard' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <div>
                <h1 style={{ color: '#2d3748', margin: '0 0 5px 0', fontSize: '32px' }}>
                  Dashboard
                </h1>
                <p style={{ color: '#718096', margin: 0, fontSize: '16px' }}>
                  Welcome back, {user?.FirstName}!
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(79, 209, 199, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                Create New Issue
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>
                  Total Issues
                </h3>
                <p style={{ fontSize: '36px', margin: '0', fontWeight: '700' }}>
                  {issues.length}
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>
                  Open Issues
                </h3>
                <p style={{ fontSize: '36px', margin: '0', fontWeight: '700' }}>
                  {issues.filter(i => i.Status === 'Open').length}
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>
                  In Progress
                </h3>
                <p style={{ fontSize: '36px', margin: '0', fontWeight: '700' }}>
                  {issues.filter(i => i.Status === 'In Progress').length}
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>
                  Resolved
                </h3>
                <p style={{ fontSize: '36px', margin: '0', fontWeight: '700' }}>
                  {issues.filter(i => i.Status === 'Resolved').length}
                </p>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'issues' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h1 style={{ color: '#2d3748', margin: 0, fontSize: '32px' }}>
                Issues Management
              </h1>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(79, 209, 199, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                Create New Issue
              </button>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}>
                    <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: '600' }}>ID</th>
                    <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: '600' }}>Title</th>
                    <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: '600' }}>Priority</th>
                    <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: '600' }}>Project</th>
                    <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: '600' }}>Assigned To</th>
                    <th style={{ padding: '15px 12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue, index) => (
                    <tr key={issue.IssueID} style={{
                      backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#4a5568' }}>
                        #{issue.IssueID}
                      </td>
                      <td style={{ padding: '12px', color: '#2d3748', fontWeight: '500' }}>
                        {issue.Title}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor:
                            issue.Status === 'Open' ? '#fed7d7' :
                            issue.Status === 'In Progress' ? '#feebc8' :
                            issue.Status === 'Testing' ? '#bee3f8' :
                            issue.Status === 'Resolved' ? '#c6f6d5' : '#e2e8f0',
                          color:
                            issue.Status === 'Open' ? '#c53030' :
                            issue.Status === 'In Progress' ? '#dd6b20' :
                            issue.Status === 'Testing' ? '#3182ce' :
                            issue.Status === 'Resolved' ? '#38a169' : '#4a5568'
                        }}>
                          {issue.Status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor:
                            issue.Priority === 'Critical' ? '#fed7d7' :
                            issue.Priority === 'High' ? '#feebc8' :
                            issue.Priority === 'Medium' ? '#bee3f8' : '#e2e8f0',
                          color:
                            issue.Priority === 'Critical' ? '#c53030' :
                            issue.Priority === 'High' ? '#dd6b20' :
                            issue.Priority === 'Medium' ? '#3182ce' : '#4a5568'
                        }}>
                          {issue.Priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#4a5568' }}>
                        {issue.ProjectName}
                      </td>
                      <td style={{ padding: '12px', color: '#4a5568' }}>
                        {issue.AssignedToName || 'Unassigned'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <select
                          value={issue.Status}
                          onChange={(e) => updateIssueStatus(issue.IssueID, e.target.value)}
                          disabled={loading}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            cursor: 'pointer',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Testing">Testing</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Issue Modal */}
        {showCreateForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h2 style={{
                color: '#2d3748',
                marginBottom: '20px',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Create New Issue
              </h2>

              {error && (
                <div style={{
                  color: '#e53e3e',
                  backgroundColor: '#fed7d7',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>
                  Project *
                </label>
                <select
                  value={newIssue.ProjectID}
                  onChange={(e) => setNewIssue({...newIssue, ProjectID: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select a project...</option>
                  {projects.map(project => (
                    <option key={project.ProjectID} value={project.ProjectID}>
                      {project.ProjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newIssue.Title}
                  onChange={(e) => setNewIssue({...newIssue, Title: e.target.value})}
                  placeholder="Enter issue title..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>
                  Description *
                </label>
                <textarea
                  value={newIssue.Description}
                  onChange={(e) => setNewIssue({...newIssue, Description: e.target.value})}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>
                    Type
                  </label>
                  <select
                    value={newIssue.IssueType}
                    onChange={(e) => setNewIssue({...newIssue, IssueType: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value="Bug">Bug</option>
                    <option value="Feature">Feature</option>
                    <option value="Enhancement">Enhancement</option>
                    <option value="Task">Task</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>
                    Priority
                  </label>
                  <select
                    value={newIssue.Priority}
                    onChange={(e) => setNewIssue({...newIssue, Priority: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>
                  Assign To
                </label>
                <select
                  value={newIssue.AssignedToUserID}
                  onChange={(e) => setNewIssue({...newIssue, AssignedToUserID: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  <option value="">Unassigned</option>
                  {assignableUsers.map(user => (
                    <option key={user.UserID} value={user.UserID}>
                      {user.FirstName} {user.LastName} ({user.Role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setError('');
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#e2e8f0',
                    color: '#4a5568',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createIssue}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Creating...' : 'Create Issue'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
