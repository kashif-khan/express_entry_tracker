import "@/app/globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata = {
  title: "Express Entry Tracker",
  description: "Track IRCC Express Entry draws and statistics",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Express Entry Tracker",
  },
  openGraph: {
    title: "Express Entry Tracker",
    description: "Track IRCC Express Entry draws and statistics with real-time updates, score predictions, and detailed analytics",
    url: "https://kashif-khan.github.io/express_entry_tracker",
    siteName: "Express Entry Tracker",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Express Entry Tracker Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Express Entry Tracker",
    description: "Track IRCC Express Entry draws and statistics with real-time updates, score predictions, and detailed analytics",
    images: ["/icon-512.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
