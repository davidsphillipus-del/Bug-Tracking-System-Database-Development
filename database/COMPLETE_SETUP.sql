-- Bug Tracking System Database Setup
-- Author: Student Project
-- Date: 2024
-- Description: Complete database setup for bug tracking application

-- Clean setup - drop existing database if it exists
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'BugTrackingSystem')
BEGIN
    ALTER DATABASE BugTrackingSystem SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BugTrackingSystem;
END
GO

CREATE DATABASE BugTrackingSystem;
GO

USE BugTrackingSystem;
GO

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'Developer', 'Tester', 'Reporter')),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE Projects (
    ProjectID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE Issues (
    IssueID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectID INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000) NOT NULL,
    IssueType NVARCHAR(20) NOT NULL CHECK (IssueType IN ('Bug', 'Feature', 'Enhancement', 'Task')),
    Priority NVARCHAR(20) NOT NULL CHECK (Priority IN ('Low', 'Medium', 'High', 'Critical')),
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Open', 'In Progress', 'Testing', 'Resolved', 'Closed', 'Reopened')),
    ReporterUserID INT NOT NULL,
    AssignedToUserID INT,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedDate DATETIME2,
    FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID),
    FOREIGN KEY (ReporterUserID) REFERENCES Users(UserID),
    FOREIGN KEY (AssignedToUserID) REFERENCES Users(UserID)
);

CREATE TABLE Comments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    IssueID INT NOT NULL,
    UserID INT NOT NULL,
    CommentText NVARCHAR(2000) NOT NULL,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (IssueID) REFERENCES Issues(IssueID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Audit log for tracking all database changes
CREATE TABLE AuditLog (
    AuditID INT IDENTITY(1,1) PRIMARY KEY,
    TableName NVARCHAR(50) NOT NULL,
    RecordID INT NOT NULL,
    Action NVARCHAR(10) NOT NULL CHECK (Action IN ('INSERT', 'UPDATE', 'DELETE')),
    OldValues NVARCHAR(MAX),
    NewValues NVARCHAR(MAX),
    ChangedByUserID INT,
    ChangeDate DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ChangedByUserID) REFERENCES Users(UserID)
);

CREATE INDEX IX_Issues_ProjectID ON Issues(ProjectID);
CREATE INDEX IX_Issues_Status ON Issues(Status);
CREATE INDEX IX_Issues_Priority ON Issues(Priority);
CREATE INDEX IX_Issues_AssignedToUserID ON Issues(AssignedToUserID);
CREATE INDEX IX_Issues_ReporterUserID ON Issues(ReporterUserID);
CREATE INDEX IX_Comments_IssueID ON Comments(IssueID);
CREATE INDEX IX_AuditLog_TableName_RecordID ON AuditLog(TableName, RecordID);

-- Stored procedure to create new issues with transaction handling
CREATE PROCEDURE sp_CreateIssue
    @ProjectID INT,
    @Title NVARCHAR(200),
    @Description NVARCHAR(1000),
    @IssueType NVARCHAR(20),
    @Priority NVARCHAR(20),
    @ReporterUserID INT,
    @AssignedToUserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @IssueID INT;
        
        INSERT INTO Issues (ProjectID, Title, Description, IssueType, Priority, Status, ReporterUserID, AssignedToUserID)
        VALUES (@ProjectID, @Title, @Description, @IssueType, @Priority, 'Open', @ReporterUserID, @AssignedToUserID);
        
        SET @IssueID = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SELECT @IssueID as IssueID;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- Stored procedure for updating issue status
CREATE PROCEDURE sp_UpdateStatus
    @IssueID INT,
    @NewStatus NVARCHAR(20),
    @ModifiedByUserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        UPDATE Issues 
        SET Status = @NewStatus, 
            ModifiedDate = GETDATE()
        WHERE IssueID = @IssueID;
        
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Issue not found', 16, 1);
            RETURN;
        END
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- Stored procedure for adding comments
CREATE PROCEDURE sp_AddComment
    @IssueID INT,
    @UserID INT,
    @CommentText NVARCHAR(2000)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        INSERT INTO Comments (IssueID, UserID, CommentText)
        VALUES (@IssueID, @UserID, @CommentText);
        
        COMMIT TRANSACTION;
        
        SELECT SCOPE_IDENTITY() as CommentID;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- Audit trigger to automatically log all changes to Issues table
CREATE TRIGGER tr_Issues_Audit
ON Issues
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Action NVARCHAR(10);
    DECLARE @UserID INT = 1; -- Default system user
    
    -- Determine action type
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
        SET @Action = 'UPDATE';
    ELSE IF EXISTS(SELECT * FROM inserted)
        SET @Action = 'INSERT';
    ELSE
        SET @Action = 'DELETE';
    
    -- Log the changes
    INSERT INTO AuditLog (TableName, RecordID, Action, ChangedByUserID)
    SELECT 'Issues', 
           COALESCE(i.IssueID, d.IssueID), 
           @Action, 
           @UserID
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.IssueID = d.IssueID;
END;
GO

-- Sample data for testing and demonstration
INSERT INTO Users (Username, PasswordHash, FirstName, LastName, Role) VALUES
('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'System', 'Administrator', 'Admin'),
('john.dev', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'John', 'Developer', 'Developer'),
('jane.tester', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Jane', 'Tester', 'Tester'),
('mike.reporter', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Mike', 'Reporter', 'Reporter');

-- Insert sample projects
INSERT INTO Projects (ProjectName, Description) VALUES
('Web Application', 'Main web application for bug tracking'),
('Mobile App', 'Mobile application for iOS and Android'),
('API Service', 'Backend API service and microservices'),
('Documentation', 'Technical documentation and user guides');

-- Insert sample issues using stored procedure
EXEC sp_CreateIssue 1, 'Login page not working', 'Users cannot login to the system. Error appears after entering credentials.', 'Bug', 'Critical', 4, 2;
EXEC sp_CreateIssue 1, 'Add password reset feature', 'Users need the ability to reset their passwords via email.', 'Feature', 'Medium', 3, 2;
EXEC sp_CreateIssue 2, 'App crashes on startup', 'Mobile app crashes immediately when opening on Android devices.', 'Bug', 'High', 4, 2;
EXEC sp_CreateIssue 1, 'Improve page loading speed', 'Dashboard and issue list pages load too slowly.', 'Enhancement', 'Low', 3, NULL;
EXEC sp_CreateIssue 3, 'Create API documentation', 'Need comprehensive API documentation for developers.', 'Task', 'Medium', 2, 2;
EXEC sp_CreateIssue 4, 'Update user manual', 'User manual needs to be updated with new features.', 'Task', 'Low', 1, 3;

-- Update some issue statuses
EXEC sp_UpdateStatus 2, 'In Progress', 2;
EXEC sp_UpdateStatus 5, 'Resolved', 2;

-- Insert sample comments
INSERT INTO Comments (IssueID, UserID, CommentText) VALUES
(1, 2, 'I am investigating this issue. It seems to be related to the authentication service.'),
(1, 4, 'This is blocking all users from accessing the system. High priority!'),
(2, 2, 'Started working on the password reset functionality. Will use email templates.'),
(3, 3, 'Confirmed this issue on Samsung Galaxy S21. Also occurs on Pixel devices.'),
(5, 2, 'API documentation is now complete and published to the developer portal.');

-- Verify database setup
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM Users
UNION ALL
SELECT 'Projects', COUNT(*) FROM Projects
UNION ALL
SELECT 'Issues', COUNT(*) FROM Issues
UNION ALL
SELECT 'Comments', COUNT(*) FROM Comments
UNION ALL
SELECT 'AuditLog', COUNT(*) FROM AuditLog;

-- Database setup complete
-- Login credentials: admin/password, john.dev/password, jane.tester/password, mike.reporter/password

GO
