import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FloatingContactButton from "@/components/FloatingContactButton";
import HomepagePopup from "@/components/HomepagePopup";
import FrontendMaintenanceScreen from "@/components/FrontendMaintenanceScreen";
import { getPublicSiteSetting } from "@/lib/siteData";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

function getMetadataBase(siteDomain: string) {
  if (!siteDomain) {
    return undefined;
  }

  try {
    return new URL(siteDomain);
  } catch {
    return undefined;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = await getPublicSiteSetting();
  const metadataBase = getMetadataBase(siteSetting.siteDomain);
  const primaryBannerImage =
    siteSetting.banners.find((banner) => banner.imageUrl)?.imageUrl ||
    siteSetting.siteLogoUrl ||
    undefined;
  const title = siteSetting.maintenanceModeEnabled
    ? `${siteSetting.siteName} Sedang Maintenance`
    : siteSetting.siteTitle;
  const description = siteSetting.maintenanceModeEnabled
    ? siteSetting.maintenanceMessage
    : siteSetting.siteDescription;

  return {
    title,
    description,
    applicationName: siteSetting.siteName,
    metadataBase,
    alternates: metadataBase
      ? {
          canonical: "/",
        }
      : undefined,
    icons: siteSetting.siteFaviconUrl
      ? {
          icon: siteSetting.siteFaviconUrl,
          shortcut: siteSetting.siteFaviconUrl,
          apple: siteSetting.siteFaviconUrl,
        }
      : undefined,
    verification: siteSetting.googleSiteVerification
      ? {
          google: siteSetting.googleSiteVerification,
        }
      : undefined,
    openGraph: {
      title,
      description,
      siteName: siteSetting.siteName,
      ...(primaryBannerImage
        ? {
            images: [
              {
                url: primaryBannerImage,
                alt: title,
              },
            ],
          }
        : {}),
      ...(metadataBase
        ? {
            url: metadataBase.toString(),
          }
        : {}),
    },
    robots: siteSetting.maintenanceModeEnabled
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettingPromise = getPublicSiteSetting();

  return (
    <html lang="id">
      <body
        className={`${jakarta.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <FrontendShell siteSettingPromise={siteSettingPromise}>
          {children}
        </FrontendShell>
      </body>
    </html>
  );
}

async function FrontendShell({
  children,
  siteSettingPromise,
}: Readonly<{
  children: React.ReactNode;
  siteSettingPromise: ReturnType<typeof getPublicSiteSetting>;
}>) {
  const siteSetting = await siteSettingPromise;

  if (siteSetting.maintenanceModeEnabled) {
    return (
      <div className="min-h-screen bg-[#111217] text-white">
        <FrontendMaintenanceScreen siteSetting={siteSetting} />
        <FloatingContactButton siteSetting={siteSetting} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111217] text-white">
      <SiteHeader siteSetting={siteSetting} />
      <div className="pt-14 sm:pt-[76px]">{children}</div>
      <SiteFooter siteSetting={siteSetting} />
      <HomepagePopup siteSetting={siteSetting} />
      <FloatingContactButton siteSetting={siteSetting} />
    </div>
  );
}
