import type { ReactFlowProps } from "@xyflow/react";
import type { ReactNode } from "react";

import React, { Suspense } from "react";
import "@xyflow/react/dist/style.css";

const ReactFlow = React.lazy(() => import('@xyflow/react').then(m => ({ default: m.ReactFlow })));
const Background = React.lazy(() => import('@xyflow/react').then(m => ({ default: m.Background })));

type CanvasProps = ReactFlowProps & {
  children?: ReactNode;
};

const deleteKeyCode = ["Backspace", "Delete"];

export const Canvas = ({ children, ...props }: CanvasProps) => (
  <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs font-mono">Loading Canvas...</div>}>
    <ReactFlow
      deleteKeyCode={deleteKeyCode}
      fitView
      panOnDrag={false}
      panOnScroll
      selectionOnDrag={true}
      zoomOnDoubleClick={false}
      {...props}
    >
      <Background bgColor="var(--sidebar)" />
      {children}
    </ReactFlow>
  </Suspense>
);
