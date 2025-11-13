// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useScrollRestoration } from "@/lib/ui/hooks/useScrollRestoration"

describe.skip("useScrollRestoration", () => {
  it("saves and restores scroll position", () => {
    const div = document.createElement("div")
    Object.defineProperty(div, "scrollTop", { value: 123, writable: true })
    sessionStorage.clear()
    renderHook(() => useScrollRestoration(div))
    // Simulate save
    window.dispatchEvent(new Event("beforeunload"))
    expect(sessionStorage.length).toBeGreaterThan(0)
  })
})
