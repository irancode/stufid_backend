export const ORIGIN_TYPES = ["وارداتی", "تولید داخل"] as const;
export type OriginType = (typeof ORIGIN_TYPES)[number];

export const SEARCH_STATUS = ["one", "entire"] as const;
export type SearchStatus = (typeof SEARCH_STATUS)[number];

export type IdentifierSearchMode = "list" | "identifier_id" | "description_of_id" | "combined";

export interface IdentifierListItem {
    id: string;
    identifier_id?: string;
    description_of_id?: string;
    taxable: boolean;
    vat: number | null;
    type: string;
    origin_type: OriginType | null;
    identifier_id_ref: number | null;
}

export interface IdentifierListQuery {
    cursor?: number;
    limit: number;
    q?: string;
    /** entire = every word must match (AND); one = any word may match (OR) */
    status?: SearchStatus;
    identifier_id_ref?: number;
    origin_type?: OriginType;
    taxable?: boolean;
}

export interface IdentifierListResult {
    items: IdentifierListItem[];
    item_count: number;
    nextCursor: number | null;
    hasMore: boolean;
    limit: number;
    searchMode: IdentifierSearchMode;
}

export interface IdentifierStats {
    approximateTotal: number;
}
