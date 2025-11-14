'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Layers2, TrendingUp, TrendingDown, Activity } from 'lucide-react';

type ChartData = Array<{
  date: string;
  success: number;
  failed: number;
}>;

const chartConfig = {
  success: {
    label: 'Success',
    color: 'hsl(142, 76%, 36%)',
  },
  failed: {
    label: 'Failed',
    color: 'hsl(0, 84%, 60%)',
  },
};

function ExecutionStatusChart({ data }: { data: ChartData }) {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Calculate stats
  const totalSuccess = data?.reduce((sum, item) => sum + item.success, 0) || 0;
  const totalFailed = data?.reduce((sum, item) => sum + item.failed, 0) || 0;
  const totalExecutions = totalSuccess + totalFailed;
  const successRate = totalExecutions > 0 ? ((totalSuccess / totalExecutions) * 100).toFixed(1) : 0;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="bg-gradient-to-br from-background to-muted/20 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <div className="rounded-lg bg-primary/10 p-2">
                <Layers2 className="h-5 w-5 text-primary" />
              </div>
              Workflow Executions
            </CardTitle>
            <CardDescription className="text-sm">
              Daily performance metrics for workflow execution status
            </CardDescription>
          </div>

          {totalExecutions > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{successRate}% Success</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Stats Summary */}
        {data && data.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
              </div>
              <p className="text-2xl font-bold">{totalExecutions.toLocaleString()}</p>
            </div>

            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 transition-all hover:border-green-500/40 hover:shadow-md">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                  Success
                </p>
              </div>
              <p className="text-2xl font-bold text-green-700">{totalSuccess.toLocaleString()}</p>
            </div>

            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 transition-all hover:border-red-500/40 hover:shadow-md">
              <div className="mb-1 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <p className="text-xs font-medium uppercase tracking-wide text-red-700">Failed</p>
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
                      <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-failed)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-failed)" stopOpacity={0} />
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
                  <YAxis hide domain={[0, 'dataMax + 10']} />
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
              <div className="flex h-[240px] flex-col items-center justify-center text-center">
                <Layers2 className="mb-3 h-12 w-12 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">
                  No execution data available
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Data will appear once workflows are executed
                </p>
              </div>
            )}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(ExecutionStatusChart);
