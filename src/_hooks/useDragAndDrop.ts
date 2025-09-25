import { useEffect, useState } from "react";
import type {DragState} from "@/_lib/drag-and-drop";
import {  dragRegistry } from "@/_lib/drag-and-drop";

export function useDragAndDrop() {
  const [dragState, setDragState] = useState<DragState>(dragRegistry.getState());

  useEffect(() => {
    const unsubscribe = dragRegistry.subscribe(setDragState);
    return unsubscribe;
  }, []);

  return dragState;
}
