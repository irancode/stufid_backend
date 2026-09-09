import { Sequelize, DataTypes, Dialect, SyncOptions } from "sequelize";
import config from "../config/database";
import { DB_SYNC_ALTER } from "../constant/env";
import { tables } from "./../utils/tables";
import { relations } from "./../utils/relations";

// Define a type for the database object
interface DbInterface {
    sequelize: Sequelize;
    Sequelize: typeof Sequelize;
    [key: string]: any;
}

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect as Dialect,
    logging: config.logging,
    timezone: config.timezone,
    dialectOptions: {
        charset: "utf8mb4",
    },
    pool: {
        max: 15,
        min: 2,
        acquire: 60000,
        idle: 10000,
    },
    define: {
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
    },
});
// sequelize.sync({ alter: true });
// Sync is opt-in (DB_SYNC=true or npm run db:sync).
// alter:true is opt-in via DB_SYNC_ALTER — slow/risky on identifiers (~6M rows).

const db: DbInterface = {} as DbInterface;
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// ! table definations
tables(db, sequelize, DataTypes);

// ! relations
relations(db);

/** Creates missing tables from models. Does not drop data. Use alter only when needed. */
export const syncDatabase = async (options: SyncOptions = {}) => {
    const alter = options.alter ?? DB_SYNC_ALTER;
    await sequelize.sync({ ...options, alter });
    console.log(`Database synced${alter ? " (alter: true)" : ""}`);
};

export default db;
