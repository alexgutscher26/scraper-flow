"use client";
import { useContext, useMemo } from "react";
import { PolitenessSettingsContext } from "@/components/context/PolitenessSettingsContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

/**
 * Renders a dialog for configuring politeness settings.
 *
 * This component utilizes the PolitenessSettingsContext to access and modify the configuration settings related to politeness features such as robots.txt enforcement, randomized delays, and user-agent rotation. It includes various input fields and switches to allow users to customize these settings, updating the context state accordingly.
 *
 * @returns A JSX element representing the politeness settings dialog, or null if the context is not available.
 */
export default function PolitenessSettingsDialog() {
  const ctx = useContext(PolitenessSettingsContext);
  const cfg = ctx?.config;
  const setCfg = ctx?.setConfig;
  const poolStr = useMemo(() => (cfg?.userAgent.pool ? cfg.userAgent.pool.join("\n") : ""), [cfg?.userAgent.pool]);
  if (!cfg || !setCfg) return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Politeness</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Politeness Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Robots.txt</span>
              <Switch checked={cfg.robots.enabled} onCheckedChange={(v) => setCfg((c) => ({ ...c, robots: { ...c.robots, enabled: v } }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Enforcement</label>
                <Select value={cfg.robots.enforcement} onValueChange={(v) => setCfg((c) => ({ ...c, robots: { ...c.robots, enforcement: v as any } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">strict</SelectItem>
                    <SelectItem value="lenient">lenient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">UA Override</label>
                <Input value={cfg.robots.userAgentOverride ?? ""} onChange={(e) => setCfg((c) => ({ ...c, robots: { ...c.robots, userAgentOverride: e.target.value || undefined } }))} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Randomized Delays</span>
              <Switch checked={cfg.delays.enabled} onCheckedChange={(v) => setCfg((c) => ({ ...c, delays: { ...c.delays, enabled: v } }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Min ms</label>
                <Input type="number" value={cfg.delays.minMs} onChange={(e) => setCfg((c) => ({ ...c, delays: { ...c.delays, minMs: Number(e.target.value) } }))} />
              </div>
              <div>
                <label className="text-sm">Max ms</label>
                <Input type="number" value={cfg.delays.maxMs} onChange={(e) => setCfg((c) => ({ ...c, delays: { ...c.delays, maxMs: Number(e.target.value) } }))} />
              </div>
              <div>
                <label className="text-sm">Jitter pct</label>
                <Input type="number" step="0.01" value={cfg.delays.jitterPct} onChange={(e) => setCfg((c) => ({ ...c, delays: { ...c.delays, jitterPct: Number(e.target.value) } }))} />
              </div>
              <div>
                <label className="text-sm">Strategy</label>
                <Select value={cfg.delays.strategy} onValueChange={(v) => setCfg((c) => ({ ...c, delays: { ...c.delays, strategy: v as any } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uniform">uniform</SelectItem>
                    <SelectItem value="normal">normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>User-Agent Rotation</span>
              <Switch checked={cfg.userAgent.enabled} onCheckedChange={(v) => setCfg((c) => ({ ...c, userAgent: { ...c.userAgent, enabled: v } }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Rotate strategy</label>
                <Select value={cfg.userAgent.rotateStrategy} onValueChange={(v) => setCfg((c) => ({ ...c, userAgent: { ...c.userAgent, rotateStrategy: v as any } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perNavigation">perNavigation</SelectItem>
                    <SelectItem value="perDomain">perDomain</SelectItem>
                    <SelectItem value="perSession">perSession</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Accept-Language</label>
                <Switch checked={cfg.userAgent.acceptLanguageRandomization ?? true} onCheckedChange={(v) => setCfg((c) => ({ ...c, userAgent: { ...c.userAgent, acceptLanguageRandomization: v } }))} />
              </div>
            </div>
            <div>
              <label className="text-sm">UA Pool (one per line)</label>
              <Textarea rows={4} value={poolStr} onChange={(e) => setCfg((c) => ({ ...c, userAgent: { ...c.userAgent, pool: e.target.value.split("\n").filter(Boolean) } }))} />
            </div>
            <div>
              <label className="text-sm">Extra headers (JSON)</label>
              <Textarea rows={4} value={JSON.stringify(cfg.userAgent.headers || {}, null, 2)} onChange={(e) => {
                let v: Record<string, string> | undefined = undefined;
                try { v = JSON.parse(e.target.value); } catch { v = undefined; }
                setCfg((c) => ({ ...c, userAgent: { ...c.userAgent, headers: v } }));
              }} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
