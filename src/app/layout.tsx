import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans, Plus_Jakarta_Sans, Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Nav from "@/components/layout/Nav";
import { Analytics } from "@vercel/analytics/next";

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

const SITE_URL = "https://meshlens-six.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MeshLens — Enterprise Data Mesh Observability & Visualization",
    template: "%s | MeshLens",
  },
  description:
    "Open-source enterprise data mesh observability tool. Interactive visualization of data lineage, pipeline health, data product quality, and governance across domains.",
  keywords: [
    "data mesh",
    "data observability",
    "enterprise data mesh",
    "data mesh observability",
    "data lineage",
    "data lineage visualization",
    "pipeline health",
    "data product observability",
    "data governance",
    "data mesh visualization",
    "enterprise data observability",
  ],
  authors: [{ name: "Naveen Mithare", url: "https://github.com/naveenmithare" }],
  creator: "Naveen Mithare",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MeshLens — Enterprise Data Mesh Observability",
    description:
      "See your enterprise data mesh. Interactive visualization of lineage, pipeline health, data products, quality, and governance in one view.",
    url: SITE_URL,
    siteName: "MeshLens",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MeshLens — Enterprise Data Mesh Observability",
    description:
      "Open-source data mesh observability: lineage, pipeline health, data product quality, and governance across domains.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        <meta name="google-site-verification" content="PIsz5-kAUpG0zILSGTJw6JUaFT5JDxnc0j6iYl3J2Sk" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "MeshLens",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              url: "https://meshlens-six.vercel.app",
              description:
                "Open-source enterprise data mesh observability tool. Interactive visualization of data lineage, pipeline health, data product quality, and governance across domains.",
              author: {
                "@type": "Person",
                name: "Naveen Mithare",
                url: "https://github.com/naveenmithare",
              },
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              keywords:
                "data mesh, data observability, enterprise data mesh, data lineage, pipeline health, data governance, data product observability",
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var bg="#fffef5",ac="#000000",fn="dm-sans";try{var r=localStorage.getItem("meshlens-settings");if(r){var s=JSON.parse(r);if(s.bg)bg=s.bg;if(s.accent)ac=s.accent;if(s.font)fn=s.font;}}catch(e){}document.documentElement.style.setProperty("--nav-bg",bg);document.documentElement.style.setProperty("--meshatlas-boot-bg",bg);document.body.style.background=bg;document.documentElement.style.setProperty("--color-mesh-accent",ac);document.documentElement.style.setProperty("--color-mesh-accent-dim",ac+"1a");document.documentElement.setAttribute("data-font",fn);})();`,
          }}
        />
      </head>
        <body suppressHydrationWarning className={`${inter.variable} ${dmSans.variable} ${jakarta.variable} ${outfit.variable} ${spaceGrotesk.variable} antialiased bg-mesh-bg text-mesh-text`}>
        <Nav />
        <main className="min-w-0 pb-[env(safe-area-inset-bottom)]">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
