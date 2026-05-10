import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import AppButton from "../common/AppButton";

type CreateSnapshotDialogProps = {
  open: boolean;
  snapshotType: "validation" | "report";
  loading?: boolean;
  onClose: () => void;
  onCreate: (payload: { name?: string; notes?: string }) => Promise<void> | void;
};

export default function CreateSnapshotDialog({
  open,
  snapshotType,
  loading = false,
  onClose,
  onCreate,
}: CreateSnapshotDialogProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setNotes("");
    }
  }, [open]);

  async function handleCreate() {
    await onCreate({
      name: name.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create {snapshotType === "validation" ? "Validation" : "Report"} Snapshot</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Save the current live {snapshotType} summary so it can be reviewed later without rerunning the live calculations.
          </Typography>
          <TextField
            label="Snapshot name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={`Optional ${snapshotType} baseline name`}
            fullWidth
          />
          <TextField
            label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional release or review notes"
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <AppButton hierarchy="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </AppButton>
        <AppButton hierarchy="primary" onClick={handleCreate} disabled={loading}>
          {loading ? "Creating..." : "Create Snapshot"}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
