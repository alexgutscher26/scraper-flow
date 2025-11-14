// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { LogViewer } from "@/app/workflow/runs/[workflowId]/[executionId]/_components/ExecutionViewer"

describe.skip("LogViewer metadata", () => {
  it("renders phaseId, taskType and toggles metadata", () => {
    const logs = [
      {
        id: "log-1",
        timestamp: new Date(),
        logLevel: "info",
        message: "message",
        phaseId: "phase-1",
        taskType: "LAUNCH_BROWSER",
        metadata: { scope: "phase", a: 1 },
      },
    ] as any
    render(<LogViewer logs={logs} />)
    expect(screen.getByText("phase-1")).toBeInTheDocument()
    expect(screen.getByText("LAUNCH_BROWSER")).toBeInTheDocument()
    const btn = screen.getByRole("button", { name: "View" })
    fireEvent.click(btn)
    expect(screen.getByText(/"scope": "phase"/)).toBeInTheDocument()
  })
})
