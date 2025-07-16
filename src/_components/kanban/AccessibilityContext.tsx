import React, { createContext, useContext, useState, useRef, useEffect } from "react";

interface AccessibilityContextType {
  announce: (message: string) => void;
  isAnnouncing: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = (message: string) => {
    if (liveRegionRef.current) {
      setIsAnnouncing(true);
      liveRegionRef.current.textContent = message;

      // Clear the message after a short delay
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = "";
        }
        setIsAnnouncing(false);
      }, 1000);
    }
  };

  return (
    <AccessibilityContext.Provider value={{ announce, isAnnouncing }}>
      {children}
      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="drag-drop-live-region"
      />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
