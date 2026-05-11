"use client";

import dynamic from "next/dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
const MeshAtlasClient = dynamic(() => import("./MeshAtlasClient"), {
  ssr: false,
  loading: () => (
    <div style={{ background: "var(--meshatlas-boot-bg, #fffef5)", minHeight: "100dvh" }} />
  ),
});

export default function MeshAtlasLoader(props: any) {
  return <MeshAtlasClient {...props} />;
}
