"use client";
import React, { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParamProps } from "@/types/appNode";
import { Textarea } from "@/components/ui/textarea";

function StringParam({
  param,
  value,
  updateNodeParamValue,
  disabled,
}: ParamProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  let Component: any = Input;
  if (param.variant == "textarea") {
    Component = Textarea;
  }

  return (
    <div className="space-y-1 p-1 w-full">
      <Label htmlFor={id} className="text-xs flex">
        {param.name}
        {param.required && <p className="text-red-400 px-2">*</p>}
      </Label>
      <Component
        id={id}
        disabled={disabled}
        className={`text-xs ${error ? "border-red-400" : ""}`}
        value={internalValue}
        placeholder="Enter value here"
        onChange={(e: any) => setInternalValue(e.target.value)}
        onBlur={(e: any) => {
          const v = e.target.value;
          // Simple client-side validation for AcceptTypes regex
          if (param.name === "AcceptTypes" && v) {
            try {
              // eslint-disable-next-line no-new
              new RegExp(String(v));
              setError(null);
            } catch {
              setError("Invalid regex pattern");
            }
          } else {
            setError(null);
          }
          updateNodeParamValue(v);
        }}
      />
      {param.helperText && (
        <p className="text-muted-foreground px-2">{param.helperText}</p>
      )}
      {error && <p className="text-red-500 text-xs px-2">{error}</p>}
    </div>
  );
}

export default StringParam;
