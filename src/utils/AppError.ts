class AppError extends Error {
    public statusCode: number;
    public errorCode: number;

    constructor(statusCode: number, message: string, errorCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.name = "AppError";

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
}

export default AppError;
