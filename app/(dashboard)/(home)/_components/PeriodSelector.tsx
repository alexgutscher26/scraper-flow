"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";

type Period = {
  month: number;
  year: number;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function PeriodSelector({
  periods,
  selectedPeriod,
}: {
  selectedPeriod: Period;
  periods: Period[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handlePeriodChange = (value: string) => {
    const [month, year] = value.split("-");
    const params = new URLSearchParams(searchParams);
    params.set("month", month);
    params.set("year", year);
    router.push(`?${params.toString()}`);
  };

  // Check if period is current month
  const isCurrentPeriod = (period: Period) => {
    const now = new Date();
    return period.month === now.getMonth() && period.year === now.getFullYear();
  };

  // Check if period is selected
  const isSelected = (period: Period) => {
    return period.month === selectedPeriod.month && period.year === selectedPeriod.year;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span className="font-medium hidden sm:inline">Period:</span>
      </div>
      
      <Select
        value={`${selectedPeriod.month}-${selectedPeriod.year}`}
        onValueChange={handlePeriodChange}
      >
        <SelectTrigger className="w-[200px] bg-background border-border hover:bg-muted/50 hover:border-primary/30 transition-all focus:ring-2 focus:ring-primary/20">
          <div className="flex items-center gap-2 flex-1">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {MONTH_NAMES[selectedPeriod.month]}
                </span>
                <span className="text-muted-foreground">
                  {selectedPeriod.year}
                </span>
                {isCurrentPeriod(selectedPeriod) && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    Current
                  </span>
                )}
              </div>
            </SelectValue>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </SelectTrigger>
        
        <SelectContent className="max-h-[300px]">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Select Period
          </div>
          {periods.map((period, index) => {
            const isCurrent = isCurrentPeriod(period);
            const selected = isSelected(period);
            
            return (
              <SelectItem
                key={index}
                value={`${period.month}-${period.year}`}
                className="cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium w-8 text-center rounded px-1.5 py-0.5 ${
                      selected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {MONTH_ABBR[period.month]}
                    </span>
                    <div className="flex flex-col">
                      <span className={`font-medium ${selected ? 'text-primary' : ''}`}>
                        {MONTH_NAMES[period.month]} {period.year}
                      </span>
                      {isCurrent && !selected && (
                        <span className="text-xs text-muted-foreground">
                          Current period
                        </span>
                      )}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export default PeriodSelector;
