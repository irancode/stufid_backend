import appAssert from "./appAssert";
import { BAD_REQUEST } from "../constant/http";
import type { z } from "zod";

export const parseBody = <T extends z.ZodType>(schema: T, body: unknown): z.infer<T> => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        const allMessages = parsed.error.issues.map((issue) => issue.message).join(" ");
        appAssert(false, BAD_REQUEST, allMessages, 0);
    }
    return parsed.data;
};
