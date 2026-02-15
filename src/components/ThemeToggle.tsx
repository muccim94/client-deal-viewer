import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";

function isDarkByTime(): boolean {
  const h = new Date().getHours();
  // Tramonto approssimativo: buio dalle 19 alle 7
  return h >= 19 || h < 7;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    if (saved === "auto" || !saved) return isDarkByTime();
    return false;
  });

  const [auto, setAuto] = useState(() => {
    const saved = localStorage.getItem("theme");
    return !saved || saved === "auto";
  });

  const applyTheme = useCallback((isDark: boolean) => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  // Apply theme on change
  useEffect(() => {
    applyTheme(dark);
  }, [dark, applyTheme]);

  // Auto-mode: check every minute
  useEffect(() => {
    if (!auto) return;
    const check = () => {
      const shouldBeDark = isDarkByTime();
      setDark(shouldBeDark);
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [auto]);

  const handleToggle = (checked: boolean) => {
    setAuto(false);
    setDark(checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
  };

  const handleAutoToggle = () => {
    setAuto(true);
    localStorage.setItem("theme", "auto");
    setDark(isDarkByTime());
  };

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch checked={dark} onCheckedChange={handleToggle} aria-label="Cambia tema" />
      <Moon className="h-4 w-4 text-muted-foreground" />
      <button
        onClick={handleAutoToggle}
        className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
          auto
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted text-muted-foreground border-border hover:bg-accent"
        }`}
        title="Tema automatico in base all'orario"
      >
        AUTO
      </button>
    </div>
  );
}
