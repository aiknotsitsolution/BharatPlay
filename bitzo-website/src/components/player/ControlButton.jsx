export default function ControlButton({
  label,
  onClick,
  active = false,
  disabled = false,
  className = "",
  children,
}) {
  return (
    <button
      type="button"
      className={`bp-ctrl-btn${active ? " bp-ctrl-btn--active" : ""}${className ? ` ${className}` : ""}`}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
