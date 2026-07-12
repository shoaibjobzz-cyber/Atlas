import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import { Alert, Box, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import AppButton from "../components/common/AppButton";
import { AtlasLogo } from "../design-system/branding";
import { useAuth } from "../context/authContextCore";
import { routePaths } from "../routes/routePaths";

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo1234");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    return <Navigate to={routePaths.landing} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(username, password);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 4, md: 5 },
        py: { xs: 2, sm: 3, md: 4 },
        bgcolor: "#ffffff",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "min(460px, 100%)",
          p: 4,
          color: "#f8fafc",
          background:
            "linear-gradient(160deg, rgba(23,78,166,0.96) 0%, rgba(14,42,90,0.94) 52%, rgba(245,158,11,0.82) 100%)",
          borderRadius: { xs: 3, sm: 4 },
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(7, 19, 45, 0.22)",
        }}
      >
        <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
          <Box
          >
            <AtlasLogo size="large" polished />
            <Typography
              variant="overline"
              sx={{ mt: 1.5, display: "block", letterSpacing: "0.18em", color: "#f59e0b", fontWeight: 700 }}
            >
              Sign In
            </Typography>
            <Typography variant="h4" fontWeight={700} color="#f8fafc">
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "rgba(226,232,240,0.86)" }}>
              Use the seeded local demo account to access your projects and project-scoped engineering data.
            </Typography>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="demo"
            fullWidth
            sx={{
              "& .MuiInputLabel-root": {
                color: "rgba(15,23,42,0.72)",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#174ea6",
              },
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255,255,255,0.98)",
                "& fieldset": {
                  borderColor: "rgba(15,23,42,0.18)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(23,78,166,0.42)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#174ea6",
                },
              },
            }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            fullWidth
            sx={{
              "& .MuiInputLabel-root": {
                color: "rgba(15,23,42,0.72)",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#174ea6",
              },
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255,255,255,0.98)",
                "& fieldset": {
                  borderColor: "rgba(15,23,42,0.18)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(23,78,166,0.42)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#174ea6",
                },
              },
            }}
          />

          <Alert
            severity="info"
            sx={{
              bgcolor: "rgba(23,78,166,0.03)",
              border: "1px solid rgba(23,78,166,0.12)",
            }}
          >
            Local demo credentials: <strong>demo</strong> / <strong>demo1234</strong>
          </Alert>

          <AppButton
            hierarchy="primary"
            type="submit"
            fullWidth
            startIcon={<LoginOutlinedIcon />}
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </AppButton>
        </Stack>
      </Paper>
    </Box>
  );
}
