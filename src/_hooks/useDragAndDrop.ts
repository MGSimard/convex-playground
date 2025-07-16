import { useEffect, useState } from "react";
import { dragRegistry, type DragState } from "@/_lib/drag-and-drop";

export function useDragAndDrop() {
  const [dragState, setDragState] = useState<DragState>(dragRegistry.getState());

  useEffect(() => {
    const unsubscribe = dragRegistry.subscribe(setDragState);
    return unsubscribe;
  }, []);

  return dragState;
}
