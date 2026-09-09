import assert from "node:assert";
import AppError from "./AppError";

function appAssert(
    condition: unknown,
    httpStatusCode: number,
    message: string,
    appErrorCode = 0,
): asserts condition {
    assert(condition, new AppError(httpStatusCode, message, appErrorCode));
}

export default appAssert;
