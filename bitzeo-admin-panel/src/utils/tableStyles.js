/**
 * Shared DataTable customStyles for the admin panel dark theme.
 * Import and pass as `customStyles={tableCustomStyles}` to any <DataTable />.
 *
 * ROOT CAUSE of visible row borders:
 *   RDT uses styled-components template literals. `rows.style` is interpolated
 *   into a CSS block (not inline style=). The default `rows.style` contains:
 *     '&:not(:last-of-type)': {
 *       borderBottomStyle: 'solid',
 *       borderBottomWidth: '1px',
 *       borderBottomColor: theme.divider.default,
 *     }
 *   This generates a CSS rule like .rdt_TableRow:not(:last-of-type) { border-bottom }
 *   with higher specificity than any flat inline override.
 *
 *   Similarly, `highlightOnHoverStyle` generates CSS &hover rules that include
 *     outlineStyle: 'solid', outlineWidth: '1px' — producing a visible box outline.
 *
 * FIX: We override the nested '&:not(:last-of-type)' selector explicitly using
 * the SAME property names (borderBottomStyle, borderBottomWidth, borderBottomColor)
 * to neutralize RDT's defaults. We also set outline: 'none' in highlightOnHoverStyle.
 */

const tableCustomStyles = {
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },
  headRow: {
    style: {
      backgroundColor: "rgba(31, 41, 55, 0.5)",
      borderBottom: "none",
      minHeight: "48px",
    },
  },
  headCells: {
    style: {
      color: "#9ca3af",
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
      color: "#d1d5db",
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
        backgroundColor: "rgba(55, 65, 81, 0.4)",
        color: "#e5e7eb",
        cursor: "default",
        borderBottom: "none",
        borderTop: "none",
        border: "none",
        boxShadow: "none",
        outline: "none",
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: "rgba(55, 65, 81, 0.4)",
      color: "#e5e7eb",
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
      color: "#d1d5db",
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
      color: "#9ca3af",
      minHeight: "56px",
    },
    pageButtonsStyle: {
      color: "#9ca3af",
      fill: "#9ca3af",
      backgroundColor: "transparent",
      borderRadius: "8px",
      "&:hover:not(:disabled)": {
        backgroundColor: "#374151",
        color: "#e5e7eb",
        fill: "#e5e7eb",
      },
      "&:disabled": {
        opacity: 0.4,
      },
    },
  },
  noData: {
    style: {
      backgroundColor: "transparent",
      color: "#6b7280",
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
