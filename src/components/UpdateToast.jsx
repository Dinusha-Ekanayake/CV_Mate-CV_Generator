import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdateToast() {
  const reloading = useRef(false);

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      // Poll every 30 s so long-lived tabs catch new deploys quickly.
      if (r) setInterval(() => r.update(), 30_000);
    }
  });

  useEffect(() => {
    // Path 1: vite-plugin-pwa detected a waiting SW → activate + reload.
    if (needRefresh && !reloading.current) {
      reloading.current = true;
      updateServiceWorker(true);
    }
  }, [needRefresh]);

  useEffect(() => {
    // Path 2: SW already activated (skipWaiting fired) and claimed this client.
    // The controllerchange event fires on the new SW taking over — reload to
    // serve the fresh precached assets instead of the in-memory stale bundle.
    const onControllerChange = () => {
      if (!reloading.current) {
        reloading.current = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
  }, []);

  return null;
}
