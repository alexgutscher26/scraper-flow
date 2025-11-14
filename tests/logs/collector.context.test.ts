import { describe, it, expect } from "vitest"
import { createLogCollector } from "@/lib/log"

describe("createLogCollector context metadata", () => {
  it("captures phaseId, taskType and metadata scope", () => {
    const collector = createLogCollector({ phaseId: "phase-1", taskType: "LAUNCH_BROWSER", metadata: { scope: "phase", extra: 123 } })
    collector.info("hello")
    const logs = collector.getAll()
    expect(logs.length).toBe(1)
    expect(logs[0].phaseId).toBe("phase-1")
    expect(logs[0].taskType).toBe("LAUNCH_BROWSER")
    expect(logs[0].metadata?.scope).toBe("phase")
    expect(logs[0].metadata?.extra).toBe(123)
  })
})
