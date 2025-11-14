'use client';
import React, { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParamProps } from '@/types/appNode';
import { Textarea } from '@/components/ui/textarea';

function StringParam({ param, value, updateNodeParamValue, disabled }: ParamProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  let Component: any = Input;
  if (param.variant == 'textarea') {
    Component = Textarea;
  }

  return (
    <div className="w-full space-y-1 p-1">
      <Label htmlFor={id} className="flex text-xs">
        {param.name}
        {param.required && <p className="px-2 text-red-400">*</p>}
      </Label>
      <Component
        id={id}
        disabled={disabled}
        className={`text-xs ${error ? 'border-red-400' : ''}`}
        value={internalValue}
        placeholder="Enter value here"
        onChange={(e: any) => setInternalValue(e.target.value)}
        onBlur={(e: any) => {
          const v = e.target.value;
          // Simple client-side validation for AcceptTypes regex
          if (param.name === 'AcceptTypes' && v) {
            try {
              // eslint-disable-next-line no-new
              new RegExp(String(v));
              setError(null);
            } catch {
              setError('Invalid regex pattern');
            }
          } else {
            setError(null);
          }
          updateNodeParamValue(v);
        }}
      />
      {param.helperText && <p className="px-2 text-muted-foreground">{param.helperText}</p>}
      {error && <p className="px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default StringParam;
