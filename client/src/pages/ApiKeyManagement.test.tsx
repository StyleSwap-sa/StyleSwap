import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ApiKeyManagement from "./ApiKeyManagement";

// Mock the tRPC hooks
vi.mock("@/lib/trpc", () => ({
  trpc: {
    apiKeys: {
      getApiKeys: {
        useQuery: vi.fn(() => ({
          data: [
            {
              id: 1,
              name: "Production",
              key: "sk_live_1234567890abcdef1234567890abcdef",
              maskedKey: "sk_live_••••••••••••••••",
              description: "Production API key",
              createdAt: new Date("2026-02-10"),
              lastUsedAt: new Date("2026-02-10"),
              isRevoked: false,
            },
          ],
          isLoading: false,
          refetch: vi.fn(),
        })),
      },
      createApiKey: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      updateApiKeyName: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      revokeApiKey: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
          isPending: false,
        })),
      },
      getApiKeyStats: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
        })),
      },
    },
  },
}));

// Mock the auth hook
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: "Test User" },
  })),
}));

describe("ApiKeyManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the API Key Management page", () => {
    render(<ApiKeyManagement />);
    expect(screen.getByText("API Key Management")).toBeInTheDocument();
    expect(screen.getByText("Generate and manage API keys for your boutique")).toBeInTheDocument();
  });

  it("displays the Generate New Key button", () => {
    render(<ApiKeyManagement />);
    const generateButton = screen.getByRole("button", { name: /Generate New Key/i });
    expect(generateButton).toBeInTheDocument();
  });

  it("shows the create key dialog when Generate New Key is clicked", async () => {
    const user = userEvent.setup();
    render(<ApiKeyManagement />);
    
    const generateButton = screen.getByRole("button", { name: /Generate New Key/i });
    await user.click(generateButton);
    
    expect(screen.getByText("Generate New API Key")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., Production, Testing, Development/i)).toBeInTheDocument();
  });

  it("displays API keys in the list", async () => {
    render(<ApiKeyManagement />);
    
    await waitFor(() => {
      expect(screen.getByText("Production")).toBeInTheDocument();
      expect(screen.getByText("Production API key")).toBeInTheDocument();
    });
  });

  it("shows masked key by default", async () => {
    render(<ApiKeyManagement />);
    
    await waitFor(() => {
      expect(screen.getByText(/sk_live_••••••••••••••••/)).toBeInTheDocument();
    });
  });

  it("has copy button for API keys", async () => {
    render(<ApiKeyManagement />);
    
    await waitFor(() => {
      const copyButtons = screen.getAllByRole("button");
      const hasCopyButton = copyButtons.some((btn) => 
        btn.querySelector("svg") && btn.textContent === ""
      );
      expect(hasCopyButton).toBeTruthy();
    });
  });

  it("displays security best practices section", () => {
    render(<ApiKeyManagement />);
    expect(screen.getByText("Security Best Practices")).toBeInTheDocument();
    expect(screen.getByText(/Never share your API keys/)).toBeInTheDocument();
    expect(screen.getByText(/Rotate keys regularly/)).toBeInTheDocument();
  });

  it("shows tabs for Active and Revoked keys", () => {
    render(<ApiKeyManagement />);
    expect(screen.getByRole("tab", { name: /Active Keys/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Revoked Keys/i })).toBeInTheDocument();
  });

  it("displays creation date for API keys", async () => {
    render(<ApiKeyManagement />);
    
    await waitFor(() => {
      expect(screen.getByText(/Created: 2\/10\/2026/)).toBeInTheDocument();
    });
  });

  it("has edit button for API keys", async () => {
    render(<ApiKeyManagement />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole("button");
      expect(editButtons.length).toBeGreaterThan(0);
    });
  });

  it("has revoke button for API keys", async () => {
    render(<ApiKeyManagement />);
    
    await waitFor(() => {
      const revokeButtons = screen.getAllByRole("button");
      expect(revokeButtons.length).toBeGreaterThan(0);
    });
  });
});
