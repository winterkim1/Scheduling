"use client";

import { useEffect, useState } from "react";
import { useMeetingStore } from "@/store/meeting-store";

export function useMeetingStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useMeetingStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    setHydrated(useMeetingStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hydrated;
}
