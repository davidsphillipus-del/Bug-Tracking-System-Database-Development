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
export {};
//# sourceMappingURL=server.d.ts.map