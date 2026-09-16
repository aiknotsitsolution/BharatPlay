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
      backgroundColor: "color-mix(in srgb, var(--bp-surface) 50%, transparent)",
      borderBottom: "none",
      minHeight: "48px",
    },
  },
  headCells: {
    style: {
      color: "var(--bp-text-secondary)",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      paddingLeft: "20px",
      paddingRight: "20px",
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
      "&:not(:last-of-type)": {
        borderBottomStyle: "none",
        borderBottomWidth: "0",
        borderBottomColor: "transparent",
        borderBottom: "none",
        borderTop: "none",
        border: "none",
        boxShadow: "none",
      },
      "&:hover": {
        backgroundColor: "color-mix(in srgb, var(--bp-border) 40%, transparent)",
        color: "var(--bp-text)",
        cursor: "default",
        borderBottom: "none",
        borderTop: "none",
        border: "none",
        boxShadow: "none",
        outline: "none",
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: "color-mix(in srgb, var(--bp-border) 40%, transparent)",
      color: "var(--bp-text)",
      outline: "none",
      outlineStyle: "none",
      outlineWidth: "0",
      borderBottom: "none",
      borderTop: "none",
      border: "none",
      boxShadow: "none",
    },
  },
  cells: {
    style: {
      paddingLeft: "20px",
      paddingRight: "20px",
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
      borderTopStyle: "none",
      borderTopWidth: "0",
      borderTopColor: "transparent",
      color: "var(--bp-text-secondary)",
      minHeight: "56px",
    },
    pageButtonsStyle: {
      color: "var(--bp-text-secondary)",
      fill: "var(--bp-text-secondary)",
      backgroundColor: "transparent",
      borderRadius: "8px",
      "&:hover:not(:disabled)": {
        backgroundColor: "var(--bp-border)",
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
