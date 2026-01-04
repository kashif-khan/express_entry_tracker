/**
 * Keyboard shortcuts system for power users
 * Provides accessible shortcuts with help overlay and conflict prevention
 */

"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { getFeatureFlag } from "@/lib/config";

interface KeyboardShortcut {
  key: string;
  combination: string[];
  description: string;
  action: () => void;
  section: string;
  ariaLabel?: string;
}

interface KeyboardContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  showHelp: boolean;
  toggleHelp: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcuts must be used within KeyboardProvider",
    );
  }
  return context;
}

interface KeyboardProviderProps {
  children: React.ReactNode;
}

export function KeyboardProvider({ children }: KeyboardProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const shortcutsEnabled = getFeatureFlag("FEATURE_A11Y_CHECKS") === "on";

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => [
      ...prev.filter((s) => s.key !== shortcut.key),
      shortcut,
    ]);
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts((prev) => prev.filter((s) => s.key !== key));
  }, []);

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
  }, []);

  // Handle keyboard events
  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts in form inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const newActiveKeys = new Set(activeKeys);
      newActiveKeys.add(event.key.toLowerCase());
      if (event.ctrlKey) newActiveKeys.add("ctrl");
      if (event.metaKey) newActiveKeys.add("meta");
      if (event.shiftKey) newActiveKeys.add("shift");
      if (event.altKey) newActiveKeys.add("alt");

      setActiveKeys(newActiveKeys);

      // Check for matching shortcuts
      for (const shortcut of shortcuts) {
        const combinationSet = new Set(
          shortcut.combination.map((k) => k.toLowerCase()),
        );
        const isMatch =
          shortcut.combination.length === newActiveKeys.size &&
          [...combinationSet].every((key) => newActiveKeys.has(key));

        if (isMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const newActiveKeys = new Set(activeKeys);
      newActiveKeys.delete(event.key.toLowerCase());
      if (!event.ctrlKey) newActiveKeys.delete("ctrl");
      if (!event.metaKey) newActiveKeys.delete("meta");
      if (!event.shiftKey) newActiveKeys.delete("shift");
      if (!event.altKey) newActiveKeys.delete("alt");

      setActiveKeys(newActiveKeys);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [shortcuts, activeKeys, shortcutsEnabled]);

  // Register default shortcuts
  useEffect(() => {
    if (!shortcutsEnabled) return;

    const defaultShortcuts: KeyboardShortcut[] = [
      {
        key: "help",
        combination: ["?"],
        description: "Show keyboard shortcuts help",
        action: toggleHelp,
        section: "General",
        ariaLabel: "Show keyboard shortcuts help",
      },
      {
        key: "escape-help",
        combination: ["Escape"],
        description: "Close help overlay",
        action: () => setShowHelp(false),
        section: "General",
      },
    ];

    defaultShortcuts.forEach(registerShortcut);

    return () => {
      defaultShortcuts.forEach((shortcut) => unregisterShortcut(shortcut.key));
    };
  }, [shortcutsEnabled, registerShortcut, unregisterShortcut, toggleHelp]);

  const contextValue: KeyboardContextType = {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    showHelp,
    toggleHelp,
  };

  return (
    <KeyboardContext.Provider value={contextValue}>
      {children}
      {showHelp && <KeyboardHelpOverlay />}
    </KeyboardContext.Provider>
  );
}

function KeyboardHelpOverlay() {
  const { shortcuts, toggleHelp } = useKeyboardShortcuts();

  // Group shortcuts by section
  const shortcutsBySection = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.section]) {
        acc[shortcut.section] = [];
      }
      acc[shortcut.section].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>,
  );

  const formatCombination = (combination: string[]) => {
    return combination
      .map((key) => {
        switch (key.toLowerCase()) {
          case "ctrl":
            return "⌃";
          case "meta":
            return "⌘";
          case "shift":
            return "⇧";
          case "alt":
            return "⌥";
          case "enter":
            return "↵";
          case "escape":
            return "Esc";
          case "arrowup":
            return "↑";
          case "arrowdown":
            return "↓";
          case "arrowleft":
            return "←";
          case "arrowright":
            return "→";
          default:
            return key.toUpperCase();
        }
      })
      .join(" + ");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={toggleHelp}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2
              id="keyboard-help-title"
              className="text-2xl font-bold text-gray-900"
            >
              Keyboard Shortcuts
            </h2>
            <button
              onClick={toggleHelp}
              className="text-gray-400 hover:text-gray-600 p-1 rounded focus:ring-2 focus:ring-blue-500"
              aria-label="Close help overlay"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(shortcutsBySection).map(
              ([section, sectionShortcuts]) => (
                <div key={section}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {section}
                  </h3>
                  <div className="space-y-2">
                    {sectionShortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex justify-between items-center py-2"
                      >
                        <span className="text-gray-700">
                          {shortcut.description}
                        </span>
                        <kbd className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm font-mono">
                          {formatCombination(shortcut.combination)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Press{" "}
              <kbd className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs font-mono">
                Esc
              </kbd>{" "}
              to close this help overlay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to register page-specific shortcuts
 */
export function usePageShortcuts(shortcuts: Omit<KeyboardShortcut, "key">[]) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    const registeredKeys: string[] = [];

    shortcuts.forEach((shortcut, index) => {
      const key = `page-shortcut-${index}`;
      registeredKeys.push(key);
      registerShortcut({ ...shortcut, key });
    });

    return () => {
      registeredKeys.forEach(unregisterShortcut);
    };
  }, [shortcuts, registerShortcut, unregisterShortcut]);
}

/**
 * Express Entry specific shortcuts hook
 */
export function useExpressEntryShortcuts(actions: {
  refreshData?: () => void;
  focusSearch?: () => void;
  showLatestDraw?: () => void;
  exportData?: () => void;
}) {
  usePageShortcuts([
    ...(actions.refreshData
      ? [
          {
            combination: ["ctrl", "r"],
            description: "Refresh data from IRCC",
            action: () => {
              // Prevent default browser refresh
              window.addEventListener(
                "keydown",
                (e) => {
                  if (e.ctrlKey && e.key === "r") {
                    e.preventDefault();
                  }
                },
                { once: true },
              );
              actions.refreshData!();
            },
            section: "Data",
            ariaLabel: "Refresh Express Entry data",
          },
        ]
      : []),

    ...(actions.focusSearch
      ? [
          {
            combination: ["ctrl", "f"],
            description: "Focus search/filter input",
            action: actions.focusSearch,
            section: "Navigation",
            ariaLabel: "Focus on search input",
          },
        ]
      : []),

    ...(actions.showLatestDraw
      ? [
          {
            combination: ["g", "l"],
            description: "Go to latest draw",
            action: actions.showLatestDraw,
            section: "Navigation",
            ariaLabel: "Navigate to latest draw",
          },
        ]
      : []),

    ...(actions.exportData
      ? [
          {
            combination: ["ctrl", "e"],
            description: "Export data",
            action: actions.exportData,
            section: "Data",
            ariaLabel: "Export draw data",
          },
        ]
      : []),

    {
      combination: ["g", "t"],
      description: "Go to top of page",
      action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      section: "Navigation",
      ariaLabel: "Scroll to top of page",
    },

    {
      combination: ["g", "s"],
      description: "Go to statistics section",
      action: () => {
        const section = document.querySelector('[data-section="statistics"]');
        section?.scrollIntoView({ behavior: "smooth" });
      },
      section: "Navigation",
      ariaLabel: "Navigate to statistics section",
    },

    {
      combination: ["g", "d"],
      description: "Go to data table",
      action: () => {
        const section = document.querySelector('[data-section="data-table"]');
        section?.scrollIntoView({ behavior: "smooth" });
      },
      section: "Navigation",
      ariaLabel: "Navigate to data table",
    },
  ]);
}

/**
 * Component to display keyboard shortcut hints
 */
export function KeyboardHint({
  shortcut,
  className = "",
}: {
  shortcut: string;
  className?: string;
}) {
  return (
    <span className={`text-xs text-gray-500 ${className}`}>
      Press{" "}
      <kbd className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs font-mono">
        {shortcut}
      </kbd>
    </span>
  );
}
