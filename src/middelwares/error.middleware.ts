import { Response, ErrorRequestHandler } from "express";
import { DatabaseError, UniqueConstraintError } from "sequelize";
import z, { ZodError } from "zod";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constant/http";
import AppError from "../utils/AppError";

const handleZodError = (res: Response, error: ZodError) => {
    const errors = error.issues.map((err) => ({
        [err.path.join(".")]: err.message,
    }));

    return res.status(BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors,
    });
};

const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof z.ZodError) {
        handleZodError(res, error);
        return;
    }

    if (error instanceof DatabaseError) {
        res.status(INTERNAL_SERVER_ERROR).json({
            result: "error",
            message: error.message,
            data: null,
        });
        return;
    }

    if (error instanceof UniqueConstraintError) {
        const errItem = error.errors?.[0];
        res.status(BAD_REQUEST).json({
            result: "error",
            message: `این مقدار قبلا استفاده شده است: ${errItem?.value}`,
            data: null,
        });
        return;
    }

    if (error instanceof AppError) {
        console.log(`error in PATH: ${req.path}`);
        console.log(error);
        res.status(error.statusCode).json({
            result: "error",
            message: error.message,
            data: null,
        });
        return;
    }

    console.log(`error in PATH: ${req.path}`);
    console.log(error);
    res.status(INTERNAL_SERVER_ERROR).json({
        result: "error",
        message: "Internal Server Error",
        data: null,
    });
};

export default errorMiddleware;
