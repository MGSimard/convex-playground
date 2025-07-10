import { useEffect, useRef } from "react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useTheme } from "@/_components/ThemeProvider";

export function TldrawCanvas() {
  const { theme } = useTheme();
  const editorRef = useRef<Editor | null>(null);

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;
    const colorScheme = theme === "system" ? "system" : theme;
    editor.user.updateUserPreferences({ colorScheme });
  };

  useEffect(() => {
    if (editorRef.current) {
      const colorScheme = theme === "system" ? "system" : theme;
      editorRef.current.user.updateUserPreferences({ colorScheme });
    }
  }, [theme]);

  return <Tldraw onMount={handleMount} />;
}
