/**
 * Shared DataTable customStyles for the VidBuxApp admin panel.
 * Uses CSS variables for theme-aware styling.
 */
const tableCustomStyles = {
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },
  headRow: {
    style: {
      // blue-tint header row (light) / darker card (dark) — theme tokens
      backgroundColor: "var(--bp-table-head)",
      borderBottom: "1px solid var(--bp-table-head-border)",
      minHeight: "44px",
    },
  },
  headCells: {
    style: {
      // uniform header look: same size + bold + theme-aware (dark in light)
      color: "var(--bp-text)",
      fontSize: "11px",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      textAlign: "left",
      justifyContent: "flex-start",
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
  rows: {
    style: {
      // RDT deep-merges its own default theme, which paints every row
      // #FFFFFF — that white leaked through in dark mode (styled-components
      // is unlayered, so no layered CSS could override it). Pin the base to
      // the card token instead: uniform rows in BOTH themes (no zebra);
      // hover colour comes from the &:hover below.
      backgroundColor: "var(--bp-card)",
      minHeight: "64px",
      color: "var(--bp-text-secondary)",
      borderBottom: "none",
      borderTop: "none",
      border: "none",
      boxShadow: "none",
      outline: "none",
      "&:hover": {
        backgroundColor: "var(--bp-elevated)",
        color: "var(--bp-text)",
        cursor: "default",
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: "var(--bp-elevated)",
      color: "var(--bp-text)",
      outline: "none",
      borderBottom: "none",
      borderTop: "none",
      border: "none",
      boxShadow: "none",
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      color: "var(--bp-text-secondary)",
      borderBottom: "none",
      borderTop: "none",
      border: "none",
      boxShadow: "none",
      outline: "none",
    },
  },
  pagination: {
    style: {
      backgroundColor: "transparent",
      borderTop: "none",
      color: "var(--bp-text-secondary)",
      minHeight: "52px",
      justifyContent: "center",
    },
    pageButtonsStyle: {
      color: "var(--bp-text-secondary)",
      fill: "var(--bp-text-secondary)",
      backgroundColor: "transparent",
      borderRadius: "6px",
      minWidth: "32px",
      minHeight: "32px",
      margin: "0 2px",
      "&:hover:not(:disabled)": {
        backgroundColor: "var(--bp-elevated)",
        color: "var(--bp-text)",
        fill: "var(--bp-text)",
      },
      "&:disabled": {
        opacity: 0.4,
      },
    },
  },
  noData: {
    style: {
      backgroundColor: "transparent",
      color: "var(--bp-text-muted)",
      padding: "48px",
    },
  },
  progress: {
    style: {
      backgroundColor: "transparent",
    },
  },
};

export default tableCustomStyles;
