import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1e40af",
      dark: "#1e3a8a",
    },
    secondary: {
      main: "#0f766e",
    },
    background: {
      default: "#edf2f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: '"Inter", "IBM Plex Sans", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    h5: {
      fontSize: "1.35rem",
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 700,
    },
    subtitle2: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 600,
      letterSpacing: 0,
      textTransform: "none",
    },
    caption: {
      lineHeight: 1.45,
    },
    body2: {
      lineHeight: 1.45,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "none",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: "100%",
          overflow: "hidden",
        },
        body: {
          height: "100%",
          overflow: "hidden",
        },
        "#root": {
          height: "100%",
          overflow: "hidden",
        },
        ":root": {
          "--atlas-font-mono": '"IBM Plex Mono", "JetBrains Mono", Consolas, "SFMono-Regular", monospace',
        },
        ".atlas-code": {
          fontFamily: 'var(--atlas-font-mono)',
          letterSpacing: "-0.01em",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 4,
          height: 24,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          paddingTop: 10,
          paddingBottom: 10,
          borderColor: "rgba(15,23,42,0.08)",
        },
        head: {
          fontSize: "0.76rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#475569",
          backgroundColor: "#f8fafc",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 38,
        },
        indicator: {
          height: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 38,
          paddingTop: 8,
          paddingBottom: 8,
          fontSize: "0.82rem",
          fontWeight: 600,
          textTransform: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: "#ffffff",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
