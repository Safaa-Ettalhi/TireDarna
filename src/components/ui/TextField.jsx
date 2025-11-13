export function TextField({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required,
}) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

