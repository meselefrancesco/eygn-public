import React, { useEffect, useState } from 'react';

interface RemoteImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  /** Rendered instead of the image if it fails to load (bucket down, deleted object, ...). */
  fallback?: React.ReactNode;
}

/** An admin-uploaded image from object storage: lazy-loaded, and never a broken-image icon. */
export const RemoteImage: React.FC<RemoteImageProps> = ({ src, fallback = null, ...imgProps }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (failed) return <>{fallback}</>;

  return <img src={src} loading="lazy" decoding="async" onError={() => setFailed(true)} {...imgProps} />;
};
