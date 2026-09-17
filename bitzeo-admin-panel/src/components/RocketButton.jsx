import { Rocket } from "lucide-react";

export default function RocketButton({
  loading = false,
  disabled = false,
  label = "Sign In",
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`relative w-full py-2.5 px-4 rounded-lg btn-primary font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center overflow-hidden ${className}`}
      {...rest}
    >
      <span
        className={`inline-flex items-center justify-center gap-2 ${loading ? "invisible" : ""}`}
        aria-hidden={loading || undefined}
      >
        <Rocket size={18} strokeWidth={2.2} />
        {children || label}
      </span>

      {loading && (
        <span className="rocket-vehicle" aria-hidden="true">
          <Rocket size={18} strokeWidth={2.2} />
        </span>
      )}
    </button>
  );
}