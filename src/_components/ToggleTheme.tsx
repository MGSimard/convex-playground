import { Check, Moon, Sun } from "lucide-react";
import type { Theme } from "@/_components/ThemeProvider";
import { Button } from "@/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/_components/ui/dropdown-menu";
import { useTheme } from "@/_components/ThemeProvider";

const THEMES: Theme[] = ["light", "dark", "system"];

export function ToggleTheme() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="cursor-pointer" />}>
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption}
            className="cursor-pointer capitalize"
            onClick={() => setTheme(themeOption)}>
            {themeOption}
            {themeOption === theme && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
