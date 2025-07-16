import { DropIndicator as AtlaskitDropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import type { Edge } from "@/_lib/drag-and-drop";

interface DropIndicatorProps {
  edge: Edge;
  isVisible?: boolean;
  gap?: string;
}

export function DropIndicator({ edge, isVisible = true, gap = "8px" }: DropIndicatorProps) {
  if (!isVisible) return null;

  return <AtlaskitDropIndicator edge={edge} gap={gap} />;
}
