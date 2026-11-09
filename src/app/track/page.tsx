import type { Metadata } from "next";
import Track from "@/components/Track";
import "@/styles/playweary.css";

export const metadata: Metadata = {
  title: "Track your order",
  alternates: { canonical: "/track" },
  robots: { index: false, follow: false },
};

export default function TrackPage() {
  return <Track />;
}
