"use client";
import React, { useEffect, useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { ParamProps } from "@/types/appNode";
import { Textarea } from "@/components/ui/textarea";

function TextareaParam({
  param,
  value,
  updateNodeParamValue,
  disabled,
}: ParamProps) {
  const [internalValue, setInternalValue] = useState(value || "");
  const id = useId();

  useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  return (
    <div className="space-y-1 p-1 w-full">
      <Label htmlFor={id} className="text-xs flex">
        {param.name}
        {param.required && <p className="text-red-400 px-2">*</p>}
      </Label>
      <Textarea
        id={id}
        disabled={disabled}
        className="text-xs min-h-[80px] resize-vertical"
        value={internalValue}
        placeholder="Enter text here..."
        onChange={(e) => setInternalValue(e.target.value)}
        onBlur={(e) => updateNodeParamValue(e.target.value)}
        rows={4}
      />
      {param.helperText && (
        <p className="text-xs text-muted-foreground">{param.helperText}</p>
      )}
    </div>
  );
}

export default TextareaParam;
