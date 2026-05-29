export function getMetadataBase(siteDomain: string) {
  if (!siteDomain) {
    return undefined;
  }

  try {
    return new URL(siteDomain);
  } catch {
    return undefined;
  }
}

export function getAbsoluteSiteUrl(siteDomain: string, pathname = "/") {
  const metadataBase = getMetadataBase(siteDomain);

  if (!metadataBase) {
    return undefined;
  }

  try {
    return new URL(pathname, metadataBase).toString();
  } catch {
    return undefined;
  }
}
