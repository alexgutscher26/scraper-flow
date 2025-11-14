"use client";

import React, { useState } from "react";
import { CirclePlayIcon, CoinsIcon, WaypointsIcon, LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactCountUpWrapper from "@/components/ReactCountUpWrapper";
import { TrendingUp } from "lucide-react";

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
      className="relative overflow-hidden h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Animated background icon */}
      {Icon && (
        <div className={`absolute -bottom-4 -right-8 transition-all duration-500 ${
          isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'
        }`}>
          <Icon
            size={120}
            className="text-muted-foreground stroke-primary opacity-10 group-hover:opacity-20 transition-opacity duration-300"
            strokeWidth={1.5}
          />
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {props.title}
        </CardTitle>
        
        {/* Icon badge */}
        {Icon && (
          <div className={`p-2 rounded-lg bg-primary/10 transition-all duration-300 ${
            isHovered ? 'scale-110 bg-primary/20' : 'scale-100'
          }`}>
            <Icon 
              className="w-4 h-4 text-primary" 
              strokeWidth={2}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="space-y-1">
          {/* Main value */}
          <div className="text-3xl font-bold text-primary tracking-tight">
            <ReactCountUpWrapper value={props.value} />
          </div>

          {/* Subtitle or trend */}
          {props.subtitle && !props.trend && (
            <p className="text-xs text-muted-foreground">
              {props.subtitle}
            </p>
          )}

          {/* Trend indicator */}
          {props.trend && (
            <div className="flex items-center gap-1 pt-1">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                props.trend.isPositive 
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                  : 'bg-red-500/10 text-red-700 dark:text-red-400'
              }`}>
                <TrendingUp 
                  className={`w-3 h-3 ${!props.trend.isPositive ? 'rotate-180' : ''}`}
                />
                <span>{Math.abs(props.trend.value)}%</span>
              </div>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary/50 transition-all duration-300 ${
        isHovered ? 'w-full' : 'w-0'
      }`} />
    </Card>
  );
}

export default StatsCard;
