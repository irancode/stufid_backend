import type { NextFunction, Request, Response } from "express";

export type { Request, Response, NextFunction };

export type AsyncRequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<any>;

export type HandlerParams = Parameters<AsyncRequestHandler>;

export type AsyncControllerHandler = (req: Request, res: Response) => Promise<any>;
