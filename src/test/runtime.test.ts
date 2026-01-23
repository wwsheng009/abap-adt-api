import { describe, it, expect } from "@jest/globals"
import { AdtQueryBuilder, formatAdtTimestamp, parseAdtTimestamp } from "../api/runtime"

describe("AdtQueryBuilder", () => {
    it("should create equals condition", () => {
        const builder = new AdtQueryBuilder()
        const query = builder.equals("responsible", "")
        expect(query).toBe("equals( responsible,  )")
    })

    it("should combine conditions with AND", () => {
        const builder = new AdtQueryBuilder()
        const query = builder.and(
            builder.equals("user", ""),
            builder.equals("responsible", "")
        )
        expect(query).toBe("and( equals( user,  ) equals( responsible,  ) )")
    })

    it("should combine conditions with OR", () => {
        const builder = new AdtQueryBuilder()
        const query = builder.or(
            builder.equals("status", "ACTIVE"),
            builder.equals("status", "PENDING")
        )
        expect(query).toBe("or( equals( status, ACTIVE ) equals( status, PENDING ) )")
    })

    it("should negate condition", () => {
        const builder = new AdtQueryBuilder()
        const query = builder.not(builder.equals("deleted", "true"))
        expect(query).toBe("not( equals( deleted, true ) )")
    })

    it("should support chaining with where", () => {
        const builder = new AdtQueryBuilder()
        const query = builder
            .where(builder.equals("user", ""))
            .where(builder.equals("responsible", ""))
            .build()
        expect(query).toBe("and( equals( user,  ) equals( responsible,  ) )")
    })

    it("should build complex query", () => {
        const builder = new AdtQueryBuilder()
        const query = builder.and(
            builder.equals("responsible", ""),
            builder.not(builder.equals("status", "DELETED"))
        )
        expect(query).toBe("and( equals( responsible,  ) not( equals( status, DELETED ) ) )")
    })
})

describe("formatAdtTimestamp", () => {
    it("should format date correctly", () => {
        const date = new Date("2026-01-23T14:30:22Z")
        const timestamp = formatAdtTimestamp(date)
        expect(timestamp).toBe("20260123143022")
    })

    it("should pad single digits with zero", () => {
        const date = new Date("2026-01-05T08:04:03Z")
        const timestamp = formatAdtTimestamp(date)
        expect(timestamp).toBe("20260105080403")
    })

    it("should handle midnight", () => {
        const date = new Date("2026-01-23T00:00:00Z")
        const timestamp = formatAdtTimestamp(date)
        expect(timestamp).toBe("20260123000000")
    })
})

describe("parseAdtTimestamp", () => {
    it("should parse timestamp correctly", () => {
        const timestamp = "20260123143022"
        const date = parseAdtTimestamp(timestamp)
        expect(date.getUTCFullYear()).toBe(2026)
        expect(date.getUTCMonth()).toBe(0) // January is 0
        expect(date.getUTCDate()).toBe(23)
        expect(date.getUTCHours()).toBe(14)
        expect(date.getUTCMinutes()).toBe(30)
        expect(date.getUTCSeconds()).toBe(22)
    })

    it("should handle midnight", () => {
        const timestamp = "20260123000000"
        const date = parseAdtTimestamp(timestamp)
        expect(date.getUTCHours()).toBe(0)
        expect(date.getUTCMinutes()).toBe(0)
        expect(date.getUTCSeconds()).toBe(0)
    })

    it("should roundtrip with formatAdtTimestamp", () => {
        const original = new Date("2026-01-23T14:30:22Z")
        const timestamp = formatAdtTimestamp(original)
        const parsed = parseAdtTimestamp(timestamp)

        expect(parsed.getUTCFullYear()).toBe(original.getUTCFullYear())
        expect(parsed.getUTCMonth()).toBe(original.getUTCMonth())
        expect(parsed.getUTCDate()).toBe(original.getUTCDate())
        expect(parsed.getUTCHours()).toBe(original.getUTCHours())
        expect(parsed.getUTCMinutes()).toBe(original.getUTCMinutes())
        expect(parsed.getUTCSeconds()).toBe(original.getUTCSeconds())
    })
})
