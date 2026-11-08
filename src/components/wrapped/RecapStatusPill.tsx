"use client";

import { Box, Typography } from "@mui/material";
import { recapStatus, type RecapRange } from "@/utils/recapSchedule";

/**
 * One line above the carousel saying which instalment is on screen and what
 * happens next.
 *
 * The recap is published in instalments and, from Monday to Thursday, the one
 * you are reading is last week's — a date range alone does not say that, and
 * people read a stale recap as a broken one. The phrase is derived from the
 * range the API returns rather than from the device's clock, so a phone in
 * another timezone cannot name the wrong day.
 */
export function RecapStatusPill({ range }: { range: RecapRange }) {
  const { lead, rest } = recapStatus(range);

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        borderRadius: "999px",
        border: "1px solid rgba(59, 130, 246, 0.35)",
        backgroundColor: "rgba(59, 130, 246, 0.12)",
        px: "12px",
        py: "6px",
        maxWidth: "100%",
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: "#60A5FA",
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontSize: 13,
          lineHeight: "18px",
          color: "#CBD5E1",
          // One line, as drawn. On a narrow phone the rest gives way before
          // the lead, which is the half that says what you are looking at.
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <Box component="span" sx={{ color: "#F1F5F9", fontWeight: 700 }}>
          {lead}
        </Box>
        {" · "}
        {rest}
      </Typography>
    </Box>
  );
}
