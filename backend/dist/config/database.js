"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'BugTrackingSystem',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
};
class Database {
    constructor() {
        this.pool = null;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        try {
            if (this.pool && this.pool.connected) {
                return this.pool;
            }
            this.pool = new mssql_1.default.ConnectionPool(config);
            await this.pool.connect();
            console.log('Connected to SQL Server database');
            return this.pool;
        }
        catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.pool) {
                await this.pool.close();
                this.pool = null;
                console.log('Disconnected from SQL Server database');
            }
        }
        catch (error) {
            console.error('Error disconnecting from database:', error);
            throw error;
        }
    }
    getPool() {
        return this.pool;
    }
    async executeQuery(query, params) {
        try {
            const pool = await this.connect();
            const request = pool.request();
            if (params) {
                params.forEach((param, index) => {
                    request.input(`param${index}`, param);
                });
            }
            return await request.query(query);
        }
        catch (error) {
            console.error('Query execution failed:', error);
            throw error;
        }
    }
    async executeProcedure(procedureName, params) {
        try {
            const pool = await this.connect();
            const request = pool.request();
            if (params) {
                Object.keys(params).forEach(key => {
                    request.input(key, params[key]);
                });
            }
            return await request.execute(procedureName);
        }
        catch (error) {
            console.error('Procedure execution failed:', error);
            throw error;
        }
    }
    async setSessionContext(key, value) {
        try {
            const pool = await this.connect();
            const request = pool.request();
            request.input('key', mssql_1.default.NVarChar(128), key);
            request.input('value', mssql_1.default.NVarChar(128), value?.toString());
            await request.query('EXEC sp_set_session_context @key, @value');
        }
        catch (error) {
            console.error('Failed to set session context:', error);
            throw error;
        }
    }
}
exports.default = Database;
//# sourceMappingURL=database.js.map