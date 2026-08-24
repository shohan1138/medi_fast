export default function Spinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-4",
  };
  return (
    <div
      className={`inline-block animate-spin rounded-full border-slate-300 border-t-blue-600 ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-slate-500">
      <Spinner size="lg" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
