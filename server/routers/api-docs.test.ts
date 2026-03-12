import { describe, it, expect } from "vitest";
import { API_ENDPOINTS, API_GUIDES, CODE_EXAMPLES } from "../api-docs-content";

describe("API Documentation Content", () => {
  describe("API Endpoints", () => {
    it("should have at least 4 endpoints", () => {
      expect(API_ENDPOINTS.length).toBeGreaterThanOrEqual(4);
    });

    it("should have required endpoint properties", () => {
      API_ENDPOINTS.forEach((endpoint) => {
        expect(endpoint).toHaveProperty("method");
        expect(endpoint).toHaveProperty("path");
        expect(endpoint).toHaveProperty("title");
        expect(endpoint).toHaveProperty("description");
        expect(endpoint).toHaveProperty("authentication");
        expect(endpoint).toHaveProperty("response");
      });
    });

    it("should have valid HTTP methods", () => {
      const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
      API_ENDPOINTS.forEach((endpoint) => {
        expect(validMethods).toContain(endpoint.method);
      });
    });

    it("should have valid paths", () => {
      API_ENDPOINTS.forEach((endpoint) => {
        expect(endpoint.path).toMatch(/^\/api\//);
      });
    });

    it("should have error definitions", () => {
      API_ENDPOINTS.forEach((endpoint) => {
        if (endpoint.errors) {
          endpoint.errors.forEach((error) => {
            expect(error).toHaveProperty("code");
            expect(error).toHaveProperty("message");
            expect(error).toHaveProperty("description");
            expect(typeof error.code).toBe("number");
          });
        }
      });
    });

    it("should have try-on endpoint", () => {
      const tryOnEndpoint = API_ENDPOINTS.find((e) => e.path.includes("tryOn"));
      expect(tryOnEndpoint).toBeDefined();
    });

    it("should have credits endpoint", () => {
      const creditsEndpoint = API_ENDPOINTS.find((e) => e.path.includes("credits"));
      expect(creditsEndpoint).toBeDefined();
    });

    it("should have webhooks endpoint", () => {
      const webhooksEndpoint = API_ENDPOINTS.find((e) => e.path.includes("webhooks"));
      expect(webhooksEndpoint).toBeDefined();
    });
  });

  describe("API Guides", () => {
    it("should have required guides", () => {
      expect(API_GUIDES).toHaveProperty("authentication");
      expect(API_GUIDES).toHaveProperty("rateLimit");
      expect(API_GUIDES).toHaveProperty("errors");
      expect(API_GUIDES).toHaveProperty("webhooks");
      expect(API_GUIDES).toHaveProperty("pricing");
    });

    it("should have guide structure", () => {
      Object.values(API_GUIDES).forEach((guide: any) => {
        expect(guide).toHaveProperty("title");
        expect(guide).toHaveProperty("content");
        expect(typeof guide.title).toBe("string");
        expect(typeof guide.content).toBe("string");
      });
    });

    it("should have meaningful guide content", () => {
      Object.values(API_GUIDES).forEach((guide: any) => {
        expect(guide.content.length).toBeGreaterThan(100);
      });
    });
  });

  describe("Code Examples", () => {
    it("should have examples for multiple languages", () => {
      expect(CODE_EXAMPLES).toHaveProperty("python");
      expect(CODE_EXAMPLES).toHaveProperty("javascript");
      expect(CODE_EXAMPLES).toHaveProperty("curl");
    });

    it("should have valid example structure", () => {
      Object.values(CODE_EXAMPLES).forEach((example: any) => {
        expect(example).toHaveProperty("title");
        expect(example).toHaveProperty("language");
        expect(example).toHaveProperty("code");
        expect(typeof example.code).toBe("string");
        expect(example.code.length).toBeGreaterThan(50);
      });
    });

    it("should have API key placeholder in examples", () => {
      Object.values(CODE_EXAMPLES).forEach((example: any) => {
        expect(example.code).toContain("sk_");
      });
    });

    it("should have try-on example in each language", () => {
      Object.values(CODE_EXAMPLES).forEach((example: any) => {
        expect(example.code.toLowerCase()).toContain("tryon");
      });
    });
  });

  describe("API Consistency", () => {
    it("should have consistent authentication across endpoints", () => {
      API_ENDPOINTS.forEach((endpoint) => {
        expect(endpoint.authentication).toContain("API Key");
      });
    });

    it("should have response examples for all endpoints", () => {
      API_ENDPOINTS.forEach((endpoint) => {
        expect(endpoint.response).toBeDefined();
        expect(endpoint.response.example).toBeDefined();
      });
    });

    it("should have rate limit info for endpoints", () => {
      const rateLimit = API_ENDPOINTS.filter((e) => e.rateLimit);
      expect(rateLimit.length).toBeGreaterThan(0);
    });
  });

  describe("Documentation Quality", () => {
    it("should have descriptive endpoint titles", () => {
      API_ENDPOINTS.forEach((endpoint) => {
        expect(endpoint.title.length).toBeGreaterThan(5);
      });
    });

    it("should have detailed endpoint descriptions", () => {
      API_ENDPOINTS.forEach((endpoint) => {
        expect(endpoint.description.length).toBeGreaterThan(10);
      });
    });

    it("should have parameter descriptions", () => {
      API_ENDPOINTS.forEach((endpoint) => {
        if (endpoint.parameters) {
          endpoint.parameters.forEach((param) => {
            expect(param.description.length).toBeGreaterThan(5);
          });
        }
      });
    });
  });
});
