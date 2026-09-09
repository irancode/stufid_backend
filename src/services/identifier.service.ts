import { QueryTypes } from "sequelize";
import db from "../models";
import {
    IdentifierListItem,
    IdentifierListQuery,
    IdentifierListResult,
    IdentifierSearchMode,
    SearchStatus,
} from "../types/identifier";

const LIST_COLUMNS =
    "id, identifier_id, description_of_id, taxable, vat, type, origin_type, identifier_id_ref";
const IDENTIFIER_ID_INDEX = "identifier_id";
const FULLTEXT_INDEX = "ft_identifiers_description";

/** InnoDB fulltext ignores tokens shorter than this (innodb_ft_min_token_size). */
const FULLTEXT_MIN_WORD_LEN = 3;

type RawIdentifierRow = {
    id: number | string;
    identifier_id: string;
    description_of_id: string;
    taxable: number | boolean;
    vat: string | number | null;
    type: string;
    origin_type: string | null;
    identifier_id_ref: number | string | null;
};

type WhereBuildResult = {
    clauses: string[];
    replacements: unknown[];
    mode: IdentifierSearchMode;
};

type RawIdentifierCountRow = {
    item_count: number | string;
};

let fulltextAvailable: boolean | null = null;

const isNumericSearch = (term: string) => /^\d+$/.test(term.trim());

const mapRow = (row: RawIdentifierRow): IdentifierListItem => ({
    id: String(row.id),
    identifier_id: row.identifier_id,
    description_of_id: row.description_of_id,
    taxable: Boolean(row.taxable),
    vat: row.vat === null || row.vat === undefined ? null : Number(row.vat),
    type: row.type,
    origin_type: row.origin_type as IdentifierListItem["origin_type"],
    identifier_id_ref:
        row.identifier_id_ref === null || row.identifier_id_ref === undefined
            ? null
            : Number(row.identifier_id_ref),
});

const escapeFulltextTerm = (term: string) => term.replace(/[+\-><()~*"@]+/g, " ").trim();

/** Query tokens (validator already drops terms shorter than 3 Unicode chars). */
const splitSearchWords = (term: string) =>
    term
        .trim()
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 0);

const partitionWords = (words: string[]) => ({
    longWords: words.filter((word) => word.length >= FULLTEXT_MIN_WORD_LEN),
    shortWords: words.filter((word) => word.length > 0 && word.length < FULLTEXT_MIN_WORD_LEN),
});

/**
 * FULLTEXT is word/token based (no mid-word substring like اطلاعات).
 *
 * BOOLEAN MODE:
 * - no + → OR (any word)
 * - leading + → AND (every word required)
 *
 * Words shorter than innodb_ft_min_token_size (e.g. "وب") are not in the
 * FULLTEXT index — apply them as space-bounded filters AFTER MATCH so the
 * index is still used and the query stays fast.
 */

/** status=one → OR over exact tokens (no prefix wildcard). */
const toFulltextQueryByWord = (words: string[]): string | null => {
    const indexed = words.map((word) => escapeFulltextTerm(word)).filter(Boolean);
    if (!indexed.length) return null;
    return indexed.join(" ");
};

/** status=entire → AND over exact tokens (no prefix wildcard). */
const toFulltextQueryEntire = (words: string[]): string | null => {
    const indexed = words.map((word) => escapeFulltextTerm(word)).filter(Boolean);
    if (!indexed.length) return null;
    return indexed.map((word) => `+${word}`).join(" ");
};

/** Exact whole-token match only (never prefix like طلا → طلائی). */
const pushWholeWordMatch = (word: string, clauses: string[], replacements: unknown[]) => {
    clauses.push(
        "(description_of_id = ? OR description_of_id LIKE ? OR description_of_id LIKE ? OR description_of_id LIKE ?)",
    );
    replacements.push(word, `${word} %`, `% ${word} %`, `% ${word}`);
};

const pushWholeWordOrGroup = (words: string[], clauses: string[], replacements: unknown[]) => {
    if (!words.length) return;
    clauses.push(
        `(${words
            .map(
                () =>
                    "(description_of_id = ? OR description_of_id LIKE ? OR description_of_id LIKE ? OR description_of_id LIKE ?)",
            )
            .join(" OR ")})`,
    );
    for (const word of words) {
        replacements.push(word, `${word} %`, `% ${word} %`, `% ${word}`);
    }
};

const loadFulltextAvailability = async (): Promise<boolean> => {
    const [row] = await db.sequelize.query<{ indexCount: number }>(
        `SELECT COUNT(*) AS indexCount
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'identifiers'
           AND INDEX_NAME = ?`,
        {
            replacements: [FULLTEXT_INDEX],
            type: QueryTypes.SELECT,
        },
    );

    fulltextAvailable = Number(row?.indexCount ?? 0) > 0;
    return fulltextAvailable;
};

/** Resolve once at startup; subsequent calls reuse the cached value. */
export const initIdentifierSearch = async (): Promise<void> => {
    await loadFulltextAvailability();
};

const hasFulltextDescriptionIndex = (): boolean => fulltextAvailable === true;

const pushIdentifierIdMatch = (term: string, clauses: string[], replacements: unknown[]) => {
    clauses.push("(identifier_id = ? OR identifier_id LIKE ?)");
    replacements.push(term, `${term}%`);
};

const pushDescriptionMatch = (
    term: string,
    status: SearchStatus,
    clauses: string[],
    replacements: unknown[],
) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    const words = splitSearchWords(trimmed);
    if (!words.length) return;

    // Single-token queries with status=entire behave as one (e.g. مشهد)
    const effectiveStatus: SearchStatus =
        status === "entire" && words.length === 1 ? "one" : status;

    const { longWords, shortWords } = partitionWords(words);

    if (hasFulltextDescriptionIndex()) {
        if (effectiveStatus === "one") {
            // OR: any long token via FULLTEXT (fast). Short tokens alone use whole-word OR.
            // When long tokens exist, short tokens are skipped in OR mode to avoid
            // `MATCH OR LIKE` full scans — long-token OR already covers the fast path.
            const ftQuery = toFulltextQueryByWord(longWords);
            if (ftQuery) {
                clauses.push("MATCH(description_of_id) AGAINST(? IN BOOLEAN MODE)");
                replacements.push(ftQuery);
                return;
            }
            pushWholeWordOrGroup(shortWords, clauses, replacements);
            return;
        }

        // entire → AND: every exact token required
        // Long tokens: FULLTEXT (+word). Short tokens: whole-word AND after MATCH (still fast).
        const ftQuery = toFulltextQueryEntire(longWords);
        if (ftQuery) {
            clauses.push("MATCH(description_of_id) AGAINST(? IN BOOLEAN MODE)");
            replacements.push(ftQuery);
        }
        for (const word of shortWords) {
            pushWholeWordMatch(word, clauses, replacements);
        }
        return;
    }

    // No FULLTEXT index — whole-word fallback
    if (effectiveStatus === "one") {
        pushWholeWordOrGroup(words, clauses, replacements);
        return;
    }
    for (const word of words) {
        pushWholeWordMatch(word, clauses, replacements);
    }
};

/**
 * Single `q` param:
 * - all digits → identifier_id (exact + prefix)
 * - otherwise → description_of_id (FULLTEXT word search)
 *
 * Optional filters after: identifier_id_ref, origin_type, taxable
 */
const buildWhere = (query: IdentifierListQuery): WhereBuildResult => {
    const clauses: string[] = [];
    const replacements: unknown[] = [];
    let mode: IdentifierSearchMode = "list";

    if (query.q) {
        const term = query.q.trim();
        let status = query.status ?? "entire";
        // Single-word queries with status=entire behave as one (e.g. مشهد)
        if (status === "entire" && !/\s/.test(term)) {
            status = "one";
        }
        if (isNumericSearch(term)) {
            pushIdentifierIdMatch(term, clauses, replacements);
            mode = "identifier_id";
        } else {
            pushDescriptionMatch(term, status, clauses, replacements);
            mode = "description_of_id";
        }
    }

    if (query.identifier_id_ref !== undefined) {
        clauses.push("identifier_id_ref = ?");
        replacements.push(query.identifier_id_ref);
        if (mode === "list") mode = "combined";
    }

    if (query.origin_type !== undefined) {
        clauses.push("origin_type = ?");
        replacements.push(query.origin_type);
        if (mode === "list") mode = "combined";
    }

    if (query.taxable !== undefined) {
        clauses.push("taxable = ?");
        replacements.push(query.taxable ? 1 : 0);
        if (mode === "list") mode = "combined";
    }

    return { clauses, replacements, mode };
};

const countFilteredIdentifiers = async (search: WhereBuildResult): Promise<number> => {
    if (!search.clauses.length) return 0;

    const [row] = await db.sequelize.query<RawIdentifierCountRow>(
        `SELECT COUNT(*) AS item_count
         FROM identifiers
         WHERE ${search.clauses.join(" AND ")}`,
        {
            replacements: search.replacements,
            type: QueryTypes.SELECT,
        },
    );

    return Number(row?.item_count ?? 0);
};

export const getIdentifierList = async (
    query: IdentifierListQuery,
): Promise<IdentifierListResult> => {
    if (fulltextAvailable === null) {
        await loadFulltextAvailability();
    }

    const pageSize = query.limit;
    // MariaDB rejects parameterized LIMIT when bound as a quoted string (LIMIT '201').
    const fetchLimit = pageSize + 1;

    const search = buildWhere(query);
    const whereParts = [...search.clauses];
    const listReplacements = [...search.replacements];

    if (query.cursor !== undefined && query.cursor > 0) {
        whereParts.push("id < ?");
        listReplacements.push(query.cursor);
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    // COUNT + page fetch in parallel (FULLTEXT path is indexed; avoids sequential wait)
    const [item_count, rows] = await Promise.all([
        countFilteredIdentifiers(search),
        db.sequelize.query<RawIdentifierRow>(
            `SELECT ${LIST_COLUMNS}
             FROM identifiers
             ${whereSql}
             ORDER BY id DESC
             LIMIT ${fetchLimit}`,
            {
                replacements: listReplacements,
                type: QueryTypes.SELECT,
            },
        ),
    ]);

    const hasMore = rows.length > pageSize;
    const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
    const items = pageRows.map(mapRow);
    const lastRow = pageRows[pageRows.length - 1];

    return {
        items,
        item_count,
        nextCursor: hasMore && lastRow ? Number(lastRow.id) : null,
        hasMore,
        limit: pageSize,
        searchMode: search.mode,
    };
};

export const getIdentifierByIdentifierId = async (
    identifierId: string,
): Promise<IdentifierListItem | null> => {
    const [row] = await db.sequelize.query<RawIdentifierRow>(
        `SELECT ${LIST_COLUMNS}
         FROM identifiers USE INDEX (${IDENTIFIER_ID_INDEX})
         WHERE identifier_id = ?
         LIMIT 1`,
        {
            replacements: [identifierId],
            type: QueryTypes.SELECT,
        },
    );
    // check if row is not null
    return row ? mapRow(row) : null;
};
