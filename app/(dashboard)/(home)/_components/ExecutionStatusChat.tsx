"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Layers2, TrendingUp, TrendingDown, Activity } from "lucide-react";

type ChartData = Array<{
  date: string;
  success: number;
  failed: number;
}>;

const chartConfig = {
  success: {
    label: "Success",
    color: "hsl(142, 76%, 36%)",
  },
  failed: {
    label: "Failed",
    color: "hsl(0, 84%, 60%)",
  },
};

function ExecutionStatusChart({ data }: { data: ChartData }) {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  // Calculate stats
  const totalSuccess = data?.reduce((sum, item) => sum + item.success, 0) || 0;
  const totalFailed = data?.reduce((sum, item) => sum + item.failed, 0) || 0;
  const totalExecutions = totalSuccess + totalFailed;
  const successRate = totalExecutions > 0 ? ((totalSuccess / totalExecutions) * 100).toFixed(1) : 0;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="pb-4 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers2 className="w-5 h-5 text-primary" />
              </div>
              Workflow Executions
            </CardTitle>
            <CardDescription className="text-sm">
              Daily performance metrics for workflow execution status
            </CardDescription>
          </div>
          
          {totalExecutions > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{successRate}% Success</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Stats Summary */}
        {data && data.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50 border border-border transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
              </div>
              <p className="text-2xl font-bold">{totalExecutions.toLocaleString()}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 transition-all hover:shadow-md hover:border-green-500/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Success</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{totalSuccess.toLocaleString()}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 transition-all hover:shadow-md hover:border-red-500/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Failed</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{totalFailed.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="rounded-lg border border-border bg-background p-4">
          <ChartContainer config={chartConfig} className="max-h-[240px] w-full">
            {data && data.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart 
                  data={data} 
                  accessibilityLayer 
                  margin={{ top: 20, right: 20, bottom: 10, left: 0 }}
                  onMouseMove={(e) => {
                    if (e?.activePayload) {
                      const payload = e.activePayload[0];
                      if (payload) {
                        setHoveredArea(payload.dataKey as string);
                      }
                    }
                  }}
                  onMouseLeave={() => setHoveredArea(null)}
                >
                  <defs>
                    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-failed)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-failed)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    minTickGap={32}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return dateFormatter.format(date);
                    }}
                  />
                  <YAxis 
                    hide 
                    domain={[0, "dataMax + 10"]} 
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <ChartTooltip 
                    content={<ChartTooltipContent className="w-[200px]" />}
                    cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--muted-foreground))' }}
                  />
                  <Area
                    type="monotone"
                    fillOpacity={1}
                    fill="url(#successGradient)"
                    stroke="var(--color-success)"
                    strokeWidth={hoveredArea === 'success' ? 3 : 2}
                    dataKey="success"
                    stackId="a"
                    animationDuration={1000}
                  />
                  <Area
                    type="monotone"
                    fillOpacity={1}
                    fill="url(#failedGradient)"
                    stroke="var(--color-failed)"
                    strokeWidth={hoveredArea === 'failed' ? 3 : 2}
                    dataKey="failed"
                    stackId="a"
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-center">
                <Layers2 className="w-12 h-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No execution data available</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Data will appear once workflows are executed</p>
              </div>
            )}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(ExecutionStatusChart);