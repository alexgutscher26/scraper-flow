'use client';
import React, { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParamProps } from '@/types/appNode';

function NumberParam({ param, value, updateNodeParamValue, disabled }: ParamProps) {
  const [internalValue, setInternalValue] = useState(value || '');
  const id = useId();

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      setInternalValue(newValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    updateNodeParamValue(newValue);
  };

  return (
    <div className="w-full space-y-1 p-1">
      <Label htmlFor={id} className="flex text-xs">
        {param.name}
        {param.required && <p className="px-2 text-red-400">*</p>}
      </Label>
      <Input
        id={id}
        disabled={disabled}
        className="text-xs"
        type="number"
        value={internalValue}
        placeholder="Enter number here"
        onChange={handleChange}
        onBlur={handleBlur}
        min={0}
        step="any"
      />
      {param.helperText && <p className="text-xs text-muted-foreground">{param.helperText}</p>}
    </div>
  );
}

export default NumberParam;
