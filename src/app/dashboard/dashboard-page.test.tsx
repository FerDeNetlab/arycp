import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock activity and compliance components
vi.mock("@/components/activity/activity-feed", () => ({
  ActivityFeed: () => <div data-testid="activity-feed">Activity Feed</div>,
}))
vi.mock("@/components/compliance/compliance-alerts", () => ({
  ComplianceAlerts: () => <div data-testid="compliance-alerts">Compliance Alerts</div>,
}))

// This will be overridden per test
const mockUserRole = vi.fn()

vi.mock("@/hooks/use-user-role", () => ({
  useUserRole: () => mockUserRole(),
  isClientRole: (role: string) => role === "cliente",
}))

import DashboardPage from "./page"

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Reset fetch mock
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ totalActive: 0, totalPending: 0, upcomingEvents: 0, alerts: 0 }),
    } as Response)
  })

  describe("loading state", () => {
    it("should show loading spinner when loading", () => {
      mockUserRole.mockReturnValue({
        role: "",
        fullName: "",
        services: null,
        loading: true,
      })

      render(<DashboardPage />)
      expect(screen.getByText("Cargando...")).toBeInTheDocument()
    })
  })

  describe("admin view", () => {
    beforeEach(() => {
      mockUserRole.mockReturnValue({
        role: "admin",
        fullName: "Admin User",
        services: {
          has_accounting: true,
          has_fiscal: true,
          has_legal: true,
          has_labor: true,
        },
        loading: false,
      })
    })

    it("should render Dashboard title for admin", () => {
      render(<DashboardPage />)
      expect(screen.getByText("Dashboard")).toBeInTheDocument()
    })

    it("should render all 4 service modules", () => {
      render(<DashboardPage />)
      expect(screen.getByText("Contabilidad")).toBeInTheDocument()
      expect(screen.getByText("Fiscal")).toBeInTheDocument()
      expect(screen.getByText("Jurídico")).toBeInTheDocument()
      expect(screen.getByText("Laboral")).toBeInTheDocument()
    })

    it("should render admin-only modules", () => {
      render(<DashboardPage />)
      expect(screen.getByText("Clientes")).toBeInTheDocument()
      expect(screen.getByText("Tramitología")).toBeInTheDocument()
      expect(screen.getByText("Control de Procesos")).toBeInTheDocument()
      expect(screen.getByText("Calendario")).toBeInTheDocument()
      expect(screen.getByText("Correos")).toBeInTheDocument()
      expect(screen.getByText("Usuarios")).toBeInTheDocument()
      expect(screen.getByText("Facturación")).toBeInTheDocument()
      expect(screen.getByText("Mensajes")).toBeInTheDocument()
    })

    it("should render KPI cards for admin", () => {
      render(<DashboardPage />)
      expect(screen.getByText("Trámites Activos")).toBeInTheDocument()
      expect(screen.getByText("Pendientes")).toBeInTheDocument()
      expect(screen.getByText("Eventos Próximos")).toBeInTheDocument()
      expect(screen.getByText("Alertas")).toBeInTheDocument()
    })

    it("should render compliance alerts for admin", () => {
      render(<DashboardPage />)
      expect(screen.getByTestId("compliance-alerts")).toBeInTheDocument()
    })

    it("should render activity feed", () => {
      render(<DashboardPage />)
      expect(screen.getByTestId("activity-feed")).toBeInTheDocument()
    })

    it("should show 'Módulos Principales' section header", () => {
      render(<DashboardPage />)
      expect(screen.getByText("Módulos Principales")).toBeInTheDocument()
    })

    it("should show 'Gestión y Herramientas' section header", () => {
      render(<DashboardPage />)
      expect(screen.getByText("Gestión y Herramientas")).toBeInTheDocument()
    })

    it("should have correct module links", () => {
      render(<DashboardPage />)
      const links = screen.getAllByRole("link")
      const hrefs = links.map((l) => l.getAttribute("href"))
      expect(hrefs).toContain("/dashboard/accounting")
      expect(hrefs).toContain("/dashboard/fiscal")
      expect(hrefs).toContain("/dashboard/legal")
      expect(hrefs).toContain("/dashboard/labor")
      expect(hrefs).toContain("/dashboard/clients")
      expect(hrefs).toContain("/dashboard/users")
    })
  })

  describe("client view", () => {
    it("should greet client by name", () => {
      mockUserRole.mockReturnValue({
        role: "cliente",
        fullName: "María García",
        services: {
          has_accounting: true,
          has_fiscal: false,
          has_legal: false,
          has_labor: false,
        },
        loading: false,
      })

      render(<DashboardPage />)
      expect(screen.getByText("Hola, María García")).toBeInTheDocument()
    })

    it("should only show hired service modules", () => {
      mockUserRole.mockReturnValue({
        role: "cliente",
        fullName: "Client",
        services: {
          has_accounting: true,
          has_fiscal: true,
          has_legal: false,
          has_labor: false,
        },
        loading: false,
      })

      render(<DashboardPage />)
      expect(screen.getByText("Contabilidad")).toBeInTheDocument()
      expect(screen.getByText("Fiscal")).toBeInTheDocument()
      expect(screen.queryByText("Jurídico")).not.toBeInTheDocument()
      expect(screen.queryByText("Laboral")).not.toBeInTheDocument()
    })

    it("should show client-specific extra modules", () => {
      mockUserRole.mockReturnValue({
        role: "cliente",
        fullName: "Client",
        services: { has_accounting: true, has_fiscal: false, has_legal: false, has_labor: false },
        loading: false,
      })

      render(<DashboardPage />)
      expect(screen.getByText("Mis Trámites")).toBeInTheDocument()
      expect(screen.getByText("Calendario")).toBeInTheDocument()
    })

    it("should NOT render KPI cards for client", () => {
      mockUserRole.mockReturnValue({
        role: "cliente",
        fullName: "Client",
        services: { has_accounting: true, has_fiscal: false, has_legal: false, has_labor: false },
        loading: false,
      })

      render(<DashboardPage />)
      expect(screen.queryByText("Trámites Activos")).not.toBeInTheDocument()
      expect(screen.queryByText("Pendientes")).not.toBeInTheDocument()
    })

    it("should NOT render compliance alerts for client", () => {
      mockUserRole.mockReturnValue({
        role: "cliente",
        fullName: "Client",
        services: { has_accounting: true, has_fiscal: false, has_legal: false, has_labor: false },
        loading: false,
      })

      render(<DashboardPage />)
      expect(screen.queryByTestId("compliance-alerts")).not.toBeInTheDocument()
    })

    it("should show 'Mis Servicios' section header instead of 'Módulos Principales'", () => {
      mockUserRole.mockReturnValue({
        role: "cliente",
        fullName: "Client",
        services: { has_accounting: true, has_fiscal: false, has_legal: false, has_labor: false },
        loading: false,
      })

      render(<DashboardPage />)
      expect(screen.getByText("Mis Servicios")).toBeInTheDocument()
      expect(screen.queryByText("Módulos Principales")).not.toBeInTheDocument()
    })

    it("should show 'Herramientas' section header instead of 'Gestión y Herramientas'", () => {
      mockUserRole.mockReturnValue({
        role: "cliente",
        fullName: "Client",
        services: { has_accounting: true, has_fiscal: false, has_legal: false, has_labor: false },
        loading: false,
      })

      render(<DashboardPage />)
      expect(screen.getByText("Herramientas")).toBeInTheDocument()
      expect(screen.queryByText("Gestión y Herramientas")).not.toBeInTheDocument()
    })

    it("should show no service modules when client has no services", () => {
      mockUserRole.mockReturnValue({
        role: "cliente",
        fullName: "Client No Services",
        services: {
          has_accounting: false,
          has_fiscal: false,
          has_legal: false,
          has_labor: false,
        },
        loading: false,
      })

      render(<DashboardPage />)
      expect(screen.queryByText("Contabilidad")).not.toBeInTheDocument()
      expect(screen.queryByText("Fiscal")).not.toBeInTheDocument()
      expect(screen.queryByText("Jurídico")).not.toBeInTheDocument()
      expect(screen.queryByText("Laboral")).not.toBeInTheDocument()
    })
  })
})
