// src/components/ui/AnimatedThemeToggler.jsx
import { Moon, SunDim } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";

export function AnimatedThemeToggler({ className }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const changeTheme = async () => {
    if (!document.startViewTransition) {
      const dark = document.documentElement.classList.toggle("dark");
      setIsDarkMode(dark);
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        const dark = document.documentElement.classList.toggle("dark");
        setIsDarkMode(dark);
      });
    }).ready;

    if (!buttonRef.current) return;
    const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
    const y = top + height / 2;
    const x = left + width / 2;
    const maxRad = Math.hypot(Math.max(left, window.innerWidth - left), Math.max(top, window.innerHeight - top));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  };

  return (
    <button
      ref={buttonRef}
      onClick={changeTheme}
      className={className}
      aria-label="Toggle theme"
    >
      {isDarkMode ? <SunDim className="text-slate-400 hover:text-amber-400 transition-colors" /> : <Moon className="text-slate-500 hover:text-brand-accent transition-colors" />}
    </button>
  );
};