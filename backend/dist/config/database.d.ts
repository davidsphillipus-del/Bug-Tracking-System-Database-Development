import sql from 'mssql';
declare class Database {
    private static instance;
    private pool;
    private constructor();
    static getInstance(): Database;
    connect(): Promise<sql.ConnectionPool>;
    disconnect(): Promise<void>;
    getPool(): sql.ConnectionPool | null;
    executeQuery(query: string, params?: any[]): Promise<sql.IResult<any>>;
    executeProcedure(procedureName: string, params?: {
        [key: string]: any;
    }): Promise<sql.IResult<any>>;
    setSessionContext(key: string, value: any): Promise<void>;
}
export default Database;
//# sourceMappingURL=database.d.ts.map