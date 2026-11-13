"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Paper, Switch, Typography } from "@mui/material";

type Setting = "weekly" | "monthly";

const ROWS: Array<{ key: Setting; label: string; hint: string }> = [
  {
    key: "weekly",
    label: "Resumen semanal",
    hint: "Te avisamos los viernes, cuando está listo.",
  },
  {
    key: "monthly",
    label: "Resumen mensual",
    hint: "Una vez por mes, sobre el final.",
  },
];

const SETTINGS_URL = `${process.env.NEXT_PUBLIC_API_URL}/users/me/recap-push`;

/**
 * Whether we may announce a recap, settable from the website as well.
 *
 * The notification itself only ever reaches the app — browsers are not in that
 * path — but the preference belongs to the account and not to a phone, so
 * somebody who lives on the site has to be able to turn it off here too.
 * Saying so in the card is the honest way to avoid promising a notification
 * the browser will never show.
 *
 * Optimistic: the switch moves on the click and goes back if the request
 * fails. Waiting on a round trip to animate a toggle makes the page feel
 * broken, and being wrong for a moment costs at most one notification.
 */
export function RecapNotificationSettings({
  accessToken,
}: {
  accessToken: string | null;
}) {
  const [settings, setSettings] = useState<Record<Setting, boolean> | null>(
    null,
  );

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    fetch(SETTINGS_URL, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("failed")),
      )
      .then((value) => {
        if (!cancelled) setSettings(value);
      })
      .catch(() => {
        // The card stays out of the way rather than showing switches whose
        // position we cannot vouch for.
        if (!cancelled) setSettings(null);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const toggle = useCallback(
    (key: Setting, value: boolean) => {
      if (!accessToken) return;
      setSettings((current) =>
        current ? { ...current, [key]: value } : current,
      );

      fetch(SETTINGS_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ [key]: value }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("failed");
        })
        .catch(() => {
          setSettings((current) =>
            current ? { ...current, [key]: !value } : current,
          );
        });
    },
    [accessToken],
  );

  if (!settings) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 2,
        background:
          "linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)",
        backdropFilter: "blur(8px)",
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontSize: "1.1rem", fontWeight: 600, mb: 0.5 }}
      >
        Avisos de Mi resumen
      </Typography>
      <Typography color="text.secondary" sx={{ fontSize: "0.85rem", mb: 1.5 }}>
        Llegan a la app de La Guía en tu teléfono.
      </Typography>

      {ROWS.map((row, index) => (
        <Box
          key={row.key}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mt: index > 0 ? 1.5 : 0,
          }}
        >
          <Box>
            <Typography>{row.label}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
              {row.hint}
            </Typography>
          </Box>
          <Switch
            checked={settings[row.key]}
            onChange={(eventObject) =>
              toggle(row.key, eventObject.target.checked)
            }
            inputProps={{ "aria-label": row.label }}
          />
        </Box>
      ))}
    </Paper>
  );
}
