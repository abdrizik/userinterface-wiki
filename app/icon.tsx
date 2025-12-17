import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default async function Icon() {
  const inter = readFileSync(
    join(process.cwd(), "public/fonts/inter/bold.ttf"),
  );

  return new ImageResponse(
    <div
      style={{
        fontSize: 24,
        background: "#111113",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fcfcfc",
        borderRadius: 6,
        fontWeight: 700,
        fontFamily: "Inter",
      }}
    >
      U
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: inter,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
