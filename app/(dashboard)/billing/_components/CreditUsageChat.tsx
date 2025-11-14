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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartColumnStacked, TrendingUp, TrendingDown, CoinsIcon, AlertCircle } from "lucide-react";
import { GetCreditUsageInPeriod } from "@/actions/analytics/getCreditUsageInPeriod";

type ChartData = Awaited<ReturnType<typeof GetCreditUsageInPeriod>>;

const chartConfig = {
  success: {
    label: "Successful Phase Credits",
    color: "hsl(142, 76%, 36%)",
  },
  failed: {
    label: "Failed Phase Credits",
    color: "hsl(0, 84%, 60%)",
  },
};

export default function CreditUsageChart({
  data,
  title,
  description,
}: {
  data: ChartData;
  title: string;
  description: string;
}) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // Calculate statistics
  const totalSuccess = data?.reduce((sum, item) => sum + (item.success || 0), 0) || 0;
  const totalFailed = data?.reduce((sum, item) => sum + (item.failed || 0), 0) || 0;
  const totalCredits = totalSuccess + totalFailed;
  const successRate = totalCredits > 0 ? ((totalSuccess / totalCredits) * 100).toFixed(1) : 0;
  const averageDaily = data?.length ? (totalCredits / data.length).toFixed(0) : 0;

  // Find peak usage day
  const peakDay = data?.reduce((max, item) => {
    const itemTotal = (item.success || 0) + (item.failed || 0);
    const maxTotal = (max.success || 0) + (max.failed || 0);
    return itemTotal > maxTotal ? item : max;
  }, data[0]);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      {/* Header */}
      <CardHeader className="pb-4 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <ChartColumnStacked className="w-5 h-5 text-primary" />
              </div>
              {title}
            </CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>

          {/* Efficiency indicator */}
          {totalCredits > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <CoinsIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{successRate}% Efficient</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Stats Summary */}
        {data && data.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50 border border-border transition-all hover:shadow-md hover:border-primary/30">
              <div className="flex items-center gap-2 mb-1">
                <CoinsIcon className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
              </div>
              <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 transition-all hover:shadow-md hover:border-green-500/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Successful</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{totalSuccess.toLocaleString()}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 transition-all hover:shadow-md hover:border-red-500/40">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Failed</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{totalFailed.toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 transition-all hover:shadow-md hover:border-blue-500/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Daily Avg</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{averageDaily}</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="rounded-lg border border-border bg-background p-4">
          <ChartContainer config={chartConfig} className="max-h-[240px] w-full">
            {data && data.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={data}
                  accessibilityLayer
                  margin={{ top: 20, right: 20, bottom: 10, left: 0 }}
                  onMouseMove={(e) => {
                    if (e?.activePayload) {
                      const payload = e.activePayload[0];
                      if (payload) {
                        setHoveredBar(payload.dataKey as string);
                      }
                    }
                  }}
                  onMouseLeave={() => setHoveredBar(null)}
                >
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
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis 
                    hide 
                    domain={[0, "dataMax + 100"]}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <ChartTooltip
                    content={<ChartTooltipContent className="w-[220px]" />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  />
                  <Bar
                    fillOpacity={hoveredBar === 'success' ? 1 : 0.8}
                    radius={[0, 0, 4, 4]}
                    fill="var(--color-success)"
                    dataKey="success"
                    stackId="a"
                    animationDuration={1000}
                  />
                  <Bar
                    fillOpacity={hoveredBar === 'failed' ? 1 : 0.8}
                    radius={[4, 4, 0, 0]}
                    fill="var(--color-failed)"
                    dataKey="failed"
                    stackId="a"
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-center">
                <ChartColumnStacked className="w-12 h-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No credit usage data available</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Data will appear once workflows consume credits</p>
              </div>
            )}
          </ChartContainer>
        </div>

        {/* Peak usage insight */}
        {peakDay && totalCredits > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Peak Usage Day
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  {new Date(peakDay.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })} used {((peakDay.success || 0) + (peakDay.failed || 0)).toLocaleString()} credits
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}