function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-400">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-xs font-medium text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;