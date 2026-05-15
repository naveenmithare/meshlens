import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans, Plus_Jakarta_Sans, Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Nav from "@/components/layout/Nav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffef5",
};

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "MeshLens — See your enterprise data mesh",
  description:
    "Visualization tool for enterprise data mesh architecture. Pipeline metadata, lineage, health, and governance in one view.",
  openGraph: {
    title: "MeshLens",
    description: "See your enterprise data mesh. Actually see it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-font="dm-sans" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var bg="#fffef5",ac="#000000",fn="dm-sans";try{var r=localStorage.getItem("meshlens-settings");if(r){var s=JSON.parse(r);if(s.bg)bg=s.bg;if(s.accent)ac=s.accent;if(s.font)fn=s.font;}}catch(e){}document.documentElement.style.setProperty("--nav-bg",bg);document.documentElement.style.setProperty("--meshatlas-boot-bg",bg);document.body.style.background=bg;document.documentElement.style.setProperty("--color-mesh-accent",ac);document.documentElement.style.setProperty("--color-mesh-accent-dim",ac+"1a");document.documentElement.setAttribute("data-font",fn);})();`,
          }}
        />
      </head>
        <body suppressHydrationWarning className={`${inter.variable} ${dmSans.variable} ${jakarta.variable} ${outfit.variable} ${spaceGrotesk.variable} antialiased bg-mesh-bg text-mesh-text`}>
        <Nav />
        <main className="min-w-0 pb-[env(safe-area-inset-bottom)]">{children}</main>
      </body>
    </html>
  );
}
