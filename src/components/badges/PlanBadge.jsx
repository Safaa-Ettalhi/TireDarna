const PLAN_STYLES = {
  gratuit: {
    solid: "bg-slate-100 text-slate-600",
    soft: "bg-slate-50 text-slate-500 border border-slate-200",
  },
  pro: {
    solid: "bg-sky-100 text-sky-700",
    soft: "bg-sky-50 text-sky-600 border border-sky-200",
  },
  premium: {
    solid: "bg-purple-100 text-purple-700",
    soft: "bg-purple-50 text-purple-600 border border-purple-200",
  },
};

const PLAN_LABELS = {
  gratuit: "Plan Gratuit",
  pro: "Plan Pro",
  premium: "Plan Premium",
};

const normalizePlanKey = (plan) => {
  if (!plan) return "gratuit";
  if (typeof plan === "string") return plan.toLowerCase();
  if (typeof plan === "object") {
    if (typeof plan.name === "string") return plan.name.toLowerCase();
    if (typeof plan.plan === "string") return plan.plan.toLowerCase();
    if (typeof plan.slug === "string") return plan.slug.toLowerCase();
  }
  return "gratuit";
};

export const getPlanLabel = (planKey) =>
  PLAN_LABELS[planKey] ?? `Plan ${planKey?.charAt(0).toUpperCase()}${planKey?.slice(1) ?? ""}`;

export function PlanBadge({ plan, variant = "solid", className = "" }) {
  const key = normalizePlanKey(plan);
  const styles = PLAN_STYLES[key]?.[variant] ?? PLAN_STYLES.gratuit[variant] ?? PLAN_STYLES.gratuit.solid;
  const label = getPlanLabel(key);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${styles} ${className}`}
    >
      {key === "premium" && <span aria-hidden="true">★</span>}
      {label}
    </span>
  );
}

export function getPlanKey(plan) {
  return normalizePlanKey(plan);
}


