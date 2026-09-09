import { z } from "zod";
import { ORIGIN_TYPES, SEARCH_STATUS } from "../types/identifier";

const MIN_SEARCH_TERM_CHARS = 3;
const SEARCH_TERM_TOO_SHORT_MSG = "Search term must be at least 3 characters";

/** Unicode code-point length (correct for Persian; not byte length). */
const unicodeLength = (value: string) => [...value].length;

const boolQuery = z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .optional()
    .transform((v) => {
        if (v === undefined) return undefined;
        if (typeof v === "boolean") return v;
        return v === "true" || v === "1";
    });

/**
 * Split on whitespace, drop terms shorter than 3 Unicode chars.
 * Errors when every provided term is too short (including a single short term).
 */
const searchQuerySchema = z
    .string()
    .trim()
    .min(1)
    .max(200)
    .transform((q, ctx) => {
        const words = q.split(/\s+/).filter((word) => word.length > 0);
        const validWords = words.filter((word) => unicodeLength(word) >= MIN_SEARCH_TERM_CHARS);

        if (validWords.length === 0) {
            ctx.addIssue({
                code: "custom",
                message: SEARCH_TERM_TOO_SHORT_MSG,
            });
            return z.NEVER;
        }

        return validWords.join(" ");
    });

export const listIdentifiersSchema = z.object({
    cursor: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    // numeric → identifier_id | text → description_of_id
    // short terms (< 3 Unicode chars) are dropped; all-short → validation error
    q: searchQuerySchema.optional(),
    // entire = every word must match (AND) | one = any word may match (OR)
    status: z.enum(SEARCH_STATUS).default("entire"),
    identifier_id_ref: z.coerce.number().int().min(1).optional(),
    origin_type: z.enum(ORIGIN_TYPES).optional(),
    taxable: boolQuery,
});

export const identifierIdParamSchema = z.object({
    identifier_id: z.string().trim().min(1).max(255),
});

export type ListIdentifiersQuery = z.infer<typeof listIdentifiersSchema>;
