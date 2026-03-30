"use client";

import type { ComponentProps } from "react";

import React, { Suspense } from "react";
import { cn } from "@/lib/utils";

const ControlsPrimitive = React.lazy(() => import('@xyflow/react').then(m => ({ default: m.Controls })));

export type ControlsProps = ComponentProps<typeof ControlsPrimitive>;

export const Controls = ({ className, ...props }: ControlsProps) => (
  <Suspense fallback={null}>
    <ControlsPrimitive
      className={cn(
        "gap-px overflow-hidden rounded-md border bg-card p-1 shadow-none!",
        "[&>button]:rounded-md [&>button]:border-none! [&>button]:bg-transparent! [&>button]:hover:bg-secondary!",
        className
      )}
      {...props}
    />
  </Suspense>
);
