import { AsyncRequestHandler, HandlerParams } from "../types";

const catchErrors = (controller: AsyncRequestHandler): AsyncRequestHandler =>
    async (...[req, res, next]: HandlerParams) => {
        try {
            await controller(req, res, next);
        } catch (error) {
            console.log(error);
            next(error);
        }
    };

export default catchErrors;