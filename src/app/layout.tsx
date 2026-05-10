import type { Metadata } from "next";
import { Inter, DM_Sans, Plus_Jakarta_Sans, Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Nav from "@/components/layout/Nav";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=localStorage.getItem("meshlens-settings");if(!r)return;var s=JSON.parse(r);if(s.bg){document.documentElement.style.setProperty("--nav-bg",s.bg);document.body.style.background=s.bg;}if(s.accent){document.documentElement.style.setProperty("--color-mesh-accent",s.accent);document.documentElement.style.setProperty("--color-mesh-accent-dim",s.accent+"1a");}if(s.font){document.documentElement.setAttribute("data-font",s.font);}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${dmSans.variable} ${jakarta.variable} ${outfit.variable} ${spaceGrotesk.variable} antialiased bg-mesh-bg text-mesh-text`}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
