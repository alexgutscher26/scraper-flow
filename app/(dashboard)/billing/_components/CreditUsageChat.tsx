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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartColumnStacked, TrendingUp, TrendingDown, CoinsIcon, AlertCircle } from 'lucide-react';
import { GetCreditUsageInPeriod } from '@/actions/analytics/getCreditUsageInPeriod';

type ChartData = Awaited<ReturnType<typeof GetCreditUsageInPeriod>>;

const chartConfig = {
  success: {
    label: 'Successful Phase Credits',
    color: 'hsl(142, 76%, 36%)',
  },
  failed: {
    label: 'Failed Phase Credits',
    color: 'hsl(0, 84%, 60%)',
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
      <CardHeader className="bg-gradient-to-br from-background to-muted/20 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <div className="rounded-lg bg-primary/10 p-2">
                <ChartColumnStacked className="h-5 w-5 text-primary" />
              </div>
              {title}
            </CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>

          {/* Efficiency indicator */}
          {totalCredits > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
              <CoinsIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{successRate}% Efficient</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Stats Summary */}
        {data && data.length > 0 && (
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 transition-all hover:border-primary/30 hover:shadow-md">
              <div className="mb-1 flex items-center gap-2">
                <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
              </div>
              <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
            </div>

            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 transition-all hover:border-green-500/40 hover:shadow-md">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                  Successful
                </p>
              </div>
              <p className="text-2xl font-bold text-green-700">{totalSuccess.toLocaleString()}</p>
            </div>

            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 transition-all hover:border-red-500/40 hover:shadow-md">
              <div className="mb-1 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs font-medium uppercase tracking-wide text-red-700">Failed</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{totalFailed.toLocaleString()}</p>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 transition-all hover:border-blue-500/40 hover:shadow-md">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                  Daily Avg
                </p>
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
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                  />
                  <YAxis hide domain={[0, 'dataMax + 100']} />
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
              <div className="flex h-[240px] flex-col items-center justify-center text-center">
                <ChartColumnStacked className="mb-3 h-12 w-12 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">
                  No credit usage data available
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Data will appear once workflows consume credits
                </p>
              </div>
            )}
          </ChartContainer>
        </div>

        {/* Peak usage insight */}
        {peakDay && totalCredits > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Peak Usage Day
                </p>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                  {new Date(peakDay.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  used {((peakDay.success || 0) + (peakDay.failed || 0)).toLocaleString()} credits
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
