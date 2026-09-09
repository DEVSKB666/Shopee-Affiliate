export function privateMediaUrl(pathname: string) {
  return `/api/media?pathname=${encodeURIComponent(pathname)}`;
}

