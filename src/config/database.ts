import dotenv from "dotenv";
import { DB_DIALECT, DB_HOST, DB_NAME, DB_PASSWORD, DB_TIME_ZONE, DB_USER } from "../constant/env";

dotenv.config();

const config = {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    dialect: DB_DIALECT,
    timezone: DB_TIME_ZONE,
    logging: false,
};

export default config;
