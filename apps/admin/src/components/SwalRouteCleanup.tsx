import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cleanupSwalBody } from '../lib/confirm';

/** Clears SweetAlert2 overlays on navigation so clicks are not blocked. */
export function SwalRouteCleanup() {
  const { pathname } = useLocation();

  useEffect(() => {
    cleanupSwalBody();
  }, [pathname]);

  return null;
}
