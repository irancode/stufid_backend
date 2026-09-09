/**
 * Sync Sequelize models to the database:
 * - creates missing tables
 * - adds/updates missing columns (alter)
 *
 * Usage:
 *   npm run db:sync              → tables + columns (alter: true)
 *   npm run db:sync -- --no-alter → create missing tables only
 *
 * Note: alter can be slow/risky on very large tables (e.g. identifiers).
 */
import "dotenv/config";
import db, { syncDatabase } from "../src/models";

const noAlter = process.argv.includes("--no-alter");
const useAlter = !noAlter;

console.log(
    useAlter
        ? "Syncing tables and columns (alter: true)..."
        : "Syncing missing tables only (alter: false)...",
);

db.sequelize
    .authenticate()
    .then(() => syncDatabase({ alter: useAlter }))
    .then(() => {
        console.log(
            useAlter
                ? "Done. Tables and fields are in sync with models."
                : "Done. Missing tables created (columns not altered).",
        );
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
