import express from "express";
import path from "path";
import {
    DB_SYNC,
    FRONTEND_URL,
    FRONTEND_STAGING_URL,
    PORT,
    SECONDARY_FRONTEND_URL,
    SECONDARY_FRONTEND_STAGING_URL,
} from "./constant/env";
import db, { syncDatabase } from "./models";
import cors from "cors";
import routes from "./routes";
import errorMiddleware from "./middelwares/error.middleware";
import { initIdentifierSearch } from "./services/identifier.service";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: [FRONTEND_URL, FRONTEND_STAGING_URL, SECONDARY_FRONTEND_URL, SECONDARY_FRONTEND_STAGING_URL],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    }),
);

app.use(express.static(path.join(__dirname, "..", "public")));

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.get("/health", (req, res) => {
    res.send("Hello World!!");
});
app.use("/api/v1", routes);

app.use(errorMiddleware);

db.sequelize
    .authenticate()
    .then(async () => {
        if (DB_SYNC) {
            await syncDatabase();
        }
    })
    .then(() => initIdentifierSearch())
    .then(() => {
        const port = Number(PORT);
        app.listen(port, "0.0.0.0", () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
        process.exit(1);
    });
