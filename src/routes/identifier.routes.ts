import express from "express";
import { index, show } from "../controllers/identifier.controller";

const router = express.Router();

router.get("/", index);
router.get("/:identifier_id", show);

export default router;
