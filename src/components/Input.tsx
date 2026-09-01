import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

export default function Input({ label, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>}
      <input
        className={
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm " +
          "shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 " +
          className
        }
        {...props}
      />
    </label>
  );
}
