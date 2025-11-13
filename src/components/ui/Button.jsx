export function Button({ children, type = "button", variant = "primary", ...props }) {
  const className =
    variant === "secondary"
      ? "rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
      : "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700";

  return (
    <button type={type} className={className} {...props}>
      {children}
    </button>
  );
}

