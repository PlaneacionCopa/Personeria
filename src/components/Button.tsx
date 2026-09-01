import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-60 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-brand-800 text-white hover:bg-brand-700 shadow-soft"
      : "bg-transparent text-brand-800 hover:bg-brand-50";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
