export interface User {
    UserID: number;
    Username: string;
    Email: string;
    FirstName: string;
    LastName: string;
    Role: 'Admin' | 'Developer' | 'Tester' | 'Reporter';
    IsActive: boolean;
    CreatedDate: Date;
    LastLoginDate?: Date;
    ModifiedDate?: Date;
}
export interface CreateUserRequest {
    Username: string;
    Email: string;
    Password: string;
    FirstName: string;
    LastName: string;
    Role: 'Admin' | 'Developer' | 'Tester' | 'Reporter';
}
export interface LoginRequest {
    Username: string;
    Password: string;
}
export interface LoginResponse {
    user: Omit<User, 'PasswordHash'>;
    token: string;
}
export interface Project {
    ProjectID: number;
    ProjectName: string;
    Description?: string;
    CreatedByUserID: number;
    IsActive: boolean;
    CreatedDate: Date;
    ModifiedDate?: Date;
}
export interface CreateProjectRequest {
    ProjectName: string;
    Description?: string;
}
export interface Issue {
    IssueID: number;
    ProjectID: number;
    Title: string;
    Description: string;
    IssueType: 'Bug' | 'Feature' | 'Enhancement' | 'Task';
    Priority: 'Low' | 'Medium' | 'High' | 'Critical';
    Status: 'Open' | 'In Progress' | 'Testing' | 'Resolved' | 'Closed' | 'Reopened';
    Severity?: 'Minor' | 'Major' | 'Critical' | 'Blocker';
    ReporterUserID: number;
    AssignedToUserID?: number;
    CreatedDate: Date;
    ModifiedDate?: Date;
    ResolvedDate?: Date;
    ClosedDate?: Date;
    EstimatedHours?: number;
    ActualHours?: number;
    ProjectName?: string;
    ReporterName?: string;
    AssignedToName?: string;
}
export interface CreateIssueRequest {
    ProjectID: number;
    Title: string;
    Description: string;
    IssueType: 'Bug' | 'Feature' | 'Enhancement' | 'Task';
    Priority: 'Low' | 'Medium' | 'High' | 'Critical';
    Severity?: 'Minor' | 'Major' | 'Critical' | 'Blocker';
    AssignedToUserID?: number;
    EstimatedHours?: number;
    InitialComment?: string;
}
export interface UpdateIssueStatusRequest {
    NewStatus: 'Open' | 'In Progress' | 'Testing' | 'Resolved' | 'Closed' | 'Reopened';
    Comments?: string;
}
export interface AssignIssueRequest {
    AssignedToUserID: number;
}
export interface Comment {
    CommentID: number;
    IssueID: number;
    UserID: number;
    CommentText: string;
    IsInternal: boolean;
    CreatedDate: Date;
    ModifiedDate?: Date;
    CommentedBy?: string;
    CommentedByUserID?: number;
}
export interface CreateCommentRequest {
    CommentText: string;
    IsInternal?: boolean;
}
export interface Attachment {
    AttachmentID: number;
    IssueID: number;
    FileName: string;
    FileSize: number;
    ContentType: string;
    FilePath: string;
    UploadedByUserID: number;
    UploadedDate: Date;
    UploadedBy?: string;
    UploadedByUserID?: number;
}
export interface IssueHistory {
    HistoryID: number;
    IssueID: number;
    FieldName: string;
    OldValue?: string;
    NewValue?: string;
    ChangedByUserID: number;
    ChangeDate: Date;
    ChangedBy?: string;
    ChangedByUserID?: number;
}
export interface IssueDetails {
    issue: Issue;
    comments: Comment[];
    history: IssueHistory[];
    attachments: Attachment[];
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T = any> {
    data: T[];
    totalRecords: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}
export interface IssueQueryParams {
    projectId?: number;
    status?: string;
    priority?: string;
    assignedToUserId?: number;
    pageNumber?: number;
    pageSize?: number;
}
export interface UserQueryParams {
    role?: string;
    isActive?: boolean;
    pageNumber?: number;
    pageSize?: number;
}
export interface JwtPayload {
    userId: number;
    username: string;
    role: string;
    iat?: number;
    exp?: number;
}
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}
//# sourceMappingURL=index.d.ts.map