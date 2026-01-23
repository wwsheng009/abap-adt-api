import { AdtHTTP } from "../AdtHTTP"
import { fullParse, xmlArray, xmlNodeAttr, parseJsonDate, xmlNode } from "../utilities"

/**********************************************************************
* TYPES
**********************************************************************/

export interface DumpsQueryOptions {
    /** Query expression in ADT format */
    query?: string;
    /** Maximum number of results to return */
    top?: number;
    /** Number of results to skip (for pagination) */
    skip?: number;
    /** Include total count in response */
    inlineCount?: boolean;
    /** Start date/time filter (format: YYYYMMDDHHmmss) */
    from?: string;
    /** Filter by responsible user */
    responsible?: string;
    /** Filter by user */
    user?: string;
}

export interface DumpEntry {
    id: string;
    author: string;
    categories: RuntimeDumpCategory[];
    title: string;
    summary: string;  // HTML formatted
    published: Date;
    updated: Date;
    links: AdtLink[];
}

export interface RuntimeDumpCategory {
    term: string;
    label: string;
}

export interface AdtLink {
    href: string;
    rel: string;
    type?: string;
}

export interface DumpsResponse {
    dumps: DumpEntry[];
    count?: number;
    title: string;
    updated: Date;
    href: string;
}

export interface SystemMessage {
    id: string;
    title: string;
    updated: Date;
    published?: Date;
    content?: string;
    links: AdtLink[];
}

export interface SystemMessagesResponse {
    messages: SystemMessage[];
    title: string;
    updated: Date;
}

/**********************************************************************
* QUERY BUILDER
**********************************************************************

/**
 * Builder for ADT query expressions
 */
export class AdtQueryBuilder {
    private conditions: string[] = [];

    /**
     * Create an equals condition
     * @param field Field name
     * @param value Field value
     * @returns Query string
     */
    equals(field: string, value: string): string {
        return `equals( ${field}, ${value} )`;
    }

    /**
     * Combine multiple conditions with AND
     * @param conditions Query conditions
     * @returns Combined query string
     */
    and(...conditions: string[]): string {
        return `and( ${conditions.join( ' ' )} )`;
    }

    /**
     * Combine multiple conditions with OR
     * @param conditions Query conditions
     * @returns Combined query string
     */
    or(...conditions: string[]): string {
        return `or( ${conditions.join( ' ' )} )`;
    }

    /**
     * Negate a condition
     * @param condition Query condition
     * @returns Negated query string
     */
    not(condition: string): string {
        return `not( ${condition} )`;
    }

    /**
     * Add a condition to the builder
     * @param condition Query condition
     * @returns Builder instance for chaining
     */
    where(condition: string): this {
        this.conditions.push(condition);
        return this;
    }

    /**
     * Build the final query string
     * @returns Query string
     */
    build(): string {
        if (this.conditions.length === 0) {
            return "";
        }
        if (this.conditions.length === 1) {
            return this.conditions[0];
        }
        return this.and(...this.conditions);
    }
}

/**********************************************************************
* PARSERS
**********************************************************************

/**
 * Parse dumps feed from XML
 */
function parseDumpsFeed(body: string): DumpsResponse {
    const raw = fullParse(body, { removeNSPrefix: true })?.feed;
    if (!raw) {
        throw new Error("Invalid feed format");
    }

    const { href } = xmlNodeAttr(raw?.link);
    const { title, updated } = raw;

    const dumps = xmlArray(raw, "entry").map((e: any) => {
        const author = xmlNode(e, "author", "name") || "";
        const categories = xmlArray(e, "category").map((c: any) => ({
            term: c["@_term"],
            label: c["@_label"]
        }));
        const { id } = e;
        const summary = e.summary?.["#text"] || "";
        const { title, published, updated } = e;
        const links = xmlArray(e, "link").map(xmlNodeAttr);

        return {
            id,
            author,
            categories,
            title,
            summary,
            published: parseJsonDate(published),
            updated: parseJsonDate(updated),
            links
        };
    });

    // Try to get count from inlinecount
    let count: number | undefined;
    // Note: inlinecount might be in different locations depending on SAP version

    return {
        href,
        title,
        updated: parseJsonDate(updated),
        dumps,
        count
    };
}

/**
 * Parse system messages feed from XML
 */
function parseSystemMessagesFeed(body: string): SystemMessagesResponse {
    const raw = fullParse(body, { removeNSPrefix: true })?.feed;
    if (!raw) {
        throw new Error("Invalid feed format");
    }

    const { title, updated } = raw;

    const messages = xmlArray(raw, "entry").map((e: any) => {
        const { id, title, updated, published } = e;
        const content = e.content?.["#text"] || "";
        const links = xmlArray(e, "link").map(xmlNodeAttr);

        return {
            id,
            title,
            updated: parseJsonDate(updated),
            published: published ? parseJsonDate(published) : undefined,
            content,
            links
        };
    });

    return {
        title,
        updated: parseJsonDate(updated),
        messages
    };
}

/**********************************************************************
* API FUNCTIONS
**********************************************************************

/**
 * Get runtime dumps with optional filtering
 * @param h ADT HTTP client
 * @param options Query options
 * @returns Dumps feed
 */
export async function getDumps(h: AdtHTTP, options: DumpsQueryOptions = {}): Promise<DumpsResponse> {
    const headers = {
        "Accept": "application/atom+xml;type=feed",
        "X-sap-adt-feed": "",
        "X-sap-adt-profiling": "server-time"
    };

    const qs: any = {};

    // Build query from options
    if (options.query) {
        qs["$query"] = options.query;
    } else if (options.responsible || options.user) {
        // Auto-build query if responsible or user is specified
        const builder = new AdtQueryBuilder();
        const conditions: string[] = [];

        if (options.responsible) {
            conditions.push(builder.equals("responsible", options.responsible));
        }
        if (options.user) {
            conditions.push(builder.equals("user", options.user));
        }

        if (conditions.length > 0) {
            qs["$query"] = builder.and(...conditions);
        }
    }

    if (options.top) {
        qs["$top"] = options.top;
    }

    if (options.skip) {
        qs["$skip"] = options.skip;
    }

    if (options.inlineCount) {
        qs["$inlinecount"] = "allpages";
    }

    if (options.from) {
        qs["from"] = options.from;
    }

    const response = await h.request("/sap/bc/adt/runtime/dumps", {
        method: "GET",
        qs,
        headers
    });

    return parseDumpsFeed(response.body);
}

/**
 * Get a single dump by ID
 * @param h ADT HTTP client
 * @param dumpId Dump ID
 * @returns Dump details as text
 */
export async function getDump(h: AdtHTTP, dumpId: string): Promise<string> {
    const headers = {
        "Accept": "text/plain"
    };

    const response = await h.request(`/sap/bc/adt/runtime/dump/${encodeURIComponent(dumpId)}`, {
        method: "GET",
        headers
    });

    return response.body;
}

/**
 * Get system messages
 * @param h ADT HTTP client
 * @returns System messages feed
 */
export async function getSystemMessages(h: AdtHTTP): Promise<SystemMessagesResponse> {
    const headers = {
        "Accept": "application/atom+xml;type=feed",
        "X-sap-adt-feed": "",
        "X-sap-adt-profiling": "server-time"
    };

    const response = await h.request("/sap/bc/adt/runtime/systemmessages", {
        method: "GET",
        headers
    });

    return parseSystemMessagesFeed(response.body);
}

/**********************************************************************
* UTILITY FUNCTIONS
**********************************************************************/

/**
 * Format timestamp for ADT queries
 * @param date Date object
 * @returns Formatted timestamp (YYYYMMDDHHmmss)
 */
export function formatAdtTimestamp(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Parse ADT timestamp
 * @param timestamp Formatted timestamp (YYYYMMDDHHmmss)
 * @returns Date object
 */
export function parseAdtTimestamp(timestamp: string): Date {
    const year = parseInt(timestamp.substring(0, 4));
    const month = parseInt(timestamp.substring(4, 6)) - 1;
    const day = parseInt(timestamp.substring(6, 8));
    const hours = parseInt(timestamp.substring(8, 10));
    const minutes = parseInt(timestamp.substring(10, 12));
    const seconds = parseInt(timestamp.substring(12, 14));

    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
}
