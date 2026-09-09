import express from "express";
import identifierRoutes from "./identifier.routes";

const router = express.Router();

router.use("/identifiers", identifierRoutes);

export default router;
