/* eslint-disable @next/next/no-img-element -- These layouts are rendered by
   satori into a static PNG, never into a browser DOM. next/image has no
   meaning here and would not work. */
import type { ReactElement } from "react";

/** Instagram's tallest feed format is 4:5; anything taller gets cropped. */
export const TOP10_WIDTH = 1080;
export const TOP10_HEIGHT = 1350;

const ROW_HEIGHT = 104;
const ROW_GAP = 16;
const PAD_X = 36;
const NUMBER_COL = 118;

const COLORS = {
  frame: "#4a7ba8",
  card: "#ffffff",
  ink: "#2d0a4e",
  leaderCard: "#2d0a4e",
  leaderInk: "#ffffff",
};

export interface Top10Row {
  program_name: string | null;
  channel_name: string | null;
  /** Already inlined as a data URI, or null when the logo could not be loaded. */
  logo: string | null;
}

/**
 * The shareable ranking artwork, as a pure function of its rows.
 *
 * Kept apart from the route so it can be rendered with fixture data and
 * eyeballed against the reference design without standing up auth and a
 * populated backend.
 */
export function renderTop10(rows: Top10Row[], footer: string): ReactElement {
  return (
    <div
      style={{
        width: TOP10_WIDTH,
        height: TOP10_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: COLORS.frame,
        padding: `40px ${PAD_X}px 0`,
        fontFamily: "Outfit, sans-serif",
      }}
    >
      {rows.map((row, index) => {
        const isLeader = index === 0;
        const name = row.program_name ?? "—";

        return (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              height: ROW_HEIGHT,
              marginBottom: index === rows.length - 1 ? 0 : ROW_GAP,
            }}
          >
            {/* The leader's number sits in its own white chip; the rest are set
                straight onto the frame. */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: NUMBER_COL,
                height: ROW_HEIGHT,
                borderRadius: 14,
                backgroundColor: isLeader ? COLORS.card : "transparent",
              }}
            >
              <span
                style={{ fontSize: 58, fontWeight: 800, color: COLORS.ink }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                height: ROW_HEIGHT,
                marginLeft: 16,
                paddingLeft: 28,
                paddingRight: 20,
                borderRadius: 14,
                backgroundColor: isLeader ? COLORS.leaderCard : COLORS.card,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingRight: 12,
                }}
              >
                <span
                  style={{
                    // Long titles step down rather than overflow the card.
                    fontSize: name.length > 22 ? 34 : 42,
                    fontWeight: 800,
                    color: isLeader ? COLORS.leaderInk : COLORS.ink,
                    textAlign: "center",
                    lineHeight: 1.1,
                  }}
                >
                  {name}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 84,
                  height: 84,
                }}
              >
                {row.logo ? (
                  <img
                    src={row.logo}
                    width={84}
                    height={84}
                    style={{ objectFit: "contain" }}
                    alt=""
                  />
                ) : (
                  // No logo: fall back to the channel name so the row still says
                  // which channel it belongs to.
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: isLeader ? COLORS.leaderInk : COLORS.ink,
                      textAlign: "center",
                    }}
                  >
                    {row.channel_name ?? ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Lighter than the row titles, as in the reference artwork — at 800 it
            competes with the ranking instead of sitting under it. */}
        <span style={{ fontSize: 34, fontWeight: 600, color: COLORS.card }}>
          {footer}
        </span>
      </div>
    </div>
  );
}
