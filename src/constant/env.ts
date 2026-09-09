import dotenv from "dotenv";
dotenv.config();
const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;

    if (value === undefined) {
        throw Error(`Missing String environment variable for ${key}`);
    }

    return value;
};

export const NODE_ENV = getEnv("NODE_ENV", "development");
export const PORT = getEnv("PORT", "5000");

export const DB_NAME = getEnv("DB_NAME", "starloft");
export const DB_HOST = getEnv("DB_HOST", "localhost");
export const DB_USER = getEnv("DB_USER", "root");
export const DB_PASSWORD = getEnv("DB_PASSWORD", "root");
export const DB_DIALECT = getEnv("DB_DIALECT", "mysql");
export const DB_TIME_ZONE = getEnv("DB_TIME_ZONE", "+03:30");
/** When true, creates missing tables on startup (does not use alter unless DB_SYNC_ALTER=true). */
export const DB_SYNC = process.env.DB_SYNC === "true";
/** Dangerous on large tables (e.g. identifiers). Use only when you need column changes applied. */
export const DB_SYNC_ALTER = process.env.DB_SYNC_ALTER === "true";
export const FRONTEND_URL = getEnv("FRONTEND_URL", "http://localhost:5173");
export const FRONTEND_STAGING_URL = getEnv("FRONTEND_STAGING_URL", "http://localhost:3001");
export const SECONDARY_FRONTEND_URL = getEnv("SECONDARY_FRONTEND_URL", "http://localhost:5174");
export const SECONDARY_FRONTEND_STAGING_URL = getEnv("SECONDARY_FRONTEND_STAGING_URL", "http://localhost:3002");
