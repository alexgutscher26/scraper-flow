'use client';

import React, { useState } from 'react';
import { CirclePlayIcon, CoinsIcon, WaypointsIcon, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactCountUpWrapper from '@/components/ReactCountUpWrapper';
import { TrendingUp } from 'lucide-react';

const iconMap = {
  CirclePlayIcon,
  WaypointsIcon,
  CoinsIcon,
} as const;

interface Props {
  title: string;
  value: number;
  icon?: keyof typeof iconMap;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

function StatsCard(props: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon: LucideIcon | undefined = props.icon ? iconMap[props.icon] : undefined;

  return (
    <Card
      className="group relative h-full overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Animated background icon */}
      {Icon && (
        <div
          className={`absolute -bottom-4 -right-8 transition-all duration-500 ${
            isHovered ? 'rotate-6 scale-110' : 'rotate-0 scale-100'
          }`}
        >
          <Icon
            size={120}
            className="stroke-primary text-muted-foreground opacity-10 transition-opacity duration-300 group-hover:opacity-20"
            strokeWidth={1.5}
          />
        </div>
      )}

      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {props.title}
        </CardTitle>

        {/* Icon badge */}
        {Icon && (
          <div
            className={`rounded-lg bg-primary/10 p-2 transition-all duration-300 ${
              isHovered ? 'scale-110 bg-primary/20' : 'scale-100'
            }`}
          >
            <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
          </div>
        )}
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="space-y-1">
          {/* Main value */}
          <div className="text-3xl font-bold tracking-tight text-primary">
            <ReactCountUpWrapper value={props.value} />
          </div>

          {/* Subtitle or trend */}
          {props.subtitle && !props.trend && (
            <p className="text-xs text-muted-foreground">{props.subtitle}</p>
          )}

          {/* Trend indicator */}
          {props.trend && (
            <div className="flex items-center gap-1 pt-1">
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  props.trend.isPositive
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400'
                }`}
              >
                <TrendingUp className={`h-3 w-3 ${!props.trend.isPositive ? 'rotate-180' : ''}`} />
                <span>{Math.abs(props.trend.value)}%</span>
              </div>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary/50 transition-all duration-300 ${
          isHovered ? 'w-full' : 'w-0'
        }`}
      />
    </Card>
  );
}

export default StatsCard;
