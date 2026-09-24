/**
 * Shared DataTable customStyles for the BharatPlay admin panel.
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
      backgroundColor: "color-mix(in srgb, var(--bp-elevated) 50%, transparent)",
      borderBottom: "none",
      minHeight: "44px",
    },
  },
  headCells: {
    style: {
      color: "var(--bp-text-secondary)",
      fontSize: "11px",
      fontWeight: "600",
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
      backgroundColor: "transparent",
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