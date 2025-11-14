'use client';
import React, { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParamProps } from '@/types/appNode';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type OptionType = {
  label: string;
  value: string;
};
export default function SelectParam({ param, value, updateNodeParamValue }: ParamProps) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-1">
      <Label htmlFor={id} className="flex text-xs">
        {param.name}
        {param.required && <p className="px-2 text-red-400">*</p>}
      </Label>
      <Select defaultValue={value} onValueChange={(value) => updateNodeParamValue(value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an option" />
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Options</SelectLabel>
              {param?.options?.map((option: OptionType) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </SelectTrigger>
      </Select>
    </div>
  );
}
