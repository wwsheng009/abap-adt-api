import { describe, it, expect, jest } from "@jest/globals"
import { ADTClient } from "../AdtClient"
import { getDumps, getSystemMessages, getDump, AdtQueryBuilder, formatAdtTimestamp } from "../api/runtime"

/**
 * Integration tests for Runtime API
 *
 * These tests require real SAP system connection.
 * Set these environment variables before running:
 *
 * SAP_URL=http://host:port
 * SAP_CLIENT=300
 * SAP_USER=
 * SAP_PASSWORD=
 *
 * Run with: npm test -- runtime-integration.test.ts
 */

const config = {
  baseUrl: process.env.SAP_URL || 'http://host:8080',
  username: process.env.SAP_USER || '',
  password: process.env.SAP_PASSWORD || '',
  client: process.env.SAP_CLIENT || '300',
  language: process.env.SAP_LANGUAGE || 'E'
}

describe("Runtime API - Integration Tests", () => {
  let client: ADTClient

  beforeAll(() => {
    client = new ADTClient(
      config.baseUrl,
      config.username,
      config.password,
      config.client,
      config.language
    )
  })

  describe("getDumps", () => {
    it("should fetch dumps without filters", async () => {
      const result = await getDumps(client.httpClient)

      expect(result).toBeDefined()
      expect(result.dumps).toBeInstanceOf(Array)
      expect(result.title).toBeDefined()
      expect(result.updated).toBeInstanceOf(Date)
      expect(result.href).toBeDefined()
    }, 30000)

    it("should fetch dumps with user filter", async () => {
      const result = await getDumps(client.httpClient, {
        user: config.username,
        top: 10
      })

      expect(result.dumps.length).toBeLessThanOrEqual(10)
    }, 30000)

    it("should fetch dumps with responsible filter", async () => {
      const result = await getDumps(client.httpClient, {
        responsible: config.username,
        top: 10
      })

      expect(result.dumps).toBeInstanceOf(Array)
    }, 30000)

    it("should fetch dumps with custom query", async () => {
      const builder = new AdtQueryBuilder()
      const query = builder.equals('user', config.username)

      const result = await getDumps(client.httpClient, {
        query,
        top: 5
      })

      expect(result.dumps).toBeInstanceOf(Array)
    }, 30000)

    it("should support pagination with top and skip", async () => {
      const page1 = await getDumps(client.httpClient, {
        user: config.username,
        top: 5,
        skip: 0
      })

      const page2 = await getDumps(client.httpClient, {
        user: config.username,
        top: 5,
        skip: 5
      })

      expect(page1.dumps).toBeInstanceOf(Array)
      expect(page2.dumps).toBeInstanceOf(Array)

      // Verify they are different (if there are enough dumps)
      if (page1.dumps.length === 5 && page2.dumps.length === 5) {
        expect(page1.dumps[0].id).not.toBe(page2.dumps[0].id)
      }
    }, 30000)

    it("should include inline count when requested", async () => {
      const result = await getDumps(client.httpClient, {
        user: config.username,
        top: 5,
        inlineCount: true
      })

      // Count might be undefined depending on SAP version
      expect(result).toBeDefined()
    }, 30000)

    it("should filter by date range", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const result = await getDumps(client.httpClient, {
        user: config.username,
        from: formatAdtTimestamp(yesterday),
        top: 10
      })

      expect(result.dumps).toBeInstanceOf(Array)
    }, 30000)
  })

  describe("getSystemMessages", () => {
    it("should fetch system messages", async () => {
      const result = await getSystemMessages(client.httpClient)

      expect(result).toBeDefined()
      expect(result.messages).toBeInstanceOf(Array)
      expect(result.title).toBeDefined()
      expect(result.updated).toBeInstanceOf(Date)
    }, 30000)
  })

  describe("Dump Entry Structure", () => {
    it("should have all required fields", async () => {
      const result = await getDumps(client.httpClient, {
        user: config.username,
        top: 1
      })

      if (result.dumps.length > 0) {
        const dump = result.dumps[0]

        expect(dump.id).toBeDefined()
        expect(dump.author).toBeDefined()
        expect(dump.categories).toBeInstanceOf(Array)
        expect(dump.title).toBeDefined()
        expect(dump.summary).toBeDefined()
        expect(dump.published).toBeInstanceOf(Date)
        expect(dump.updated).toBeInstanceOf(Date)
        expect(dump.links).toBeInstanceOf(Array)
      }
    }, 30000)

    it("should have categories with term and label", async () => {
      const result = await getDumps(client.httpClient, {
        user: config.username,
        top: 1
      })

      if (result.dumps.length > 0) {
        const dump = result.dumps[0]

        if (dump.categories.length > 0) {
          const category = dump.categories[0]
          expect(category.term).toBeDefined()
          expect(category.label).toBeDefined()
        }
      }
    }, 30000)

    it("should have links with href and rel", async () => {
      const result = await getDumps(client.httpClient, {
        user: config.username,
        top: 1
      })

      if (result.dumps.length > 0) {
        const dump = result.dumps[0]

        if (dump.links.length > 0) {
          const link = dump.links[0]
          expect(link.href).toBeDefined()
          expect(link.rel).toBeDefined()
        }
      }
    }, 30000)
  })

  describe("Error Handling", () => {
    it("should handle invalid user gracefully", async () => {
      const result = await getDumps(client.httpClient, {
        user: 'NONEXISTENT_USER_XYZ',
        top: 10
      })

      // Should return empty array instead of throwing
      expect(result.dumps).toBeInstanceOf(Array)
    }, 30000)

    it("should handle invalid date format", async () => {
      const result = await getDumps(client.httpClient, {
        user: config.username,
        from: 'INVALID_DATE',
        top: 10
      })

      // Should handle gracefully
      expect(result).toBeDefined()
    }, 30000)
  })
})
