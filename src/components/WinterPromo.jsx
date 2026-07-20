"use client";

import { useEffect, useRef, useState } from "react";
import Snowfall from "./Snowfall";
import WinterOfferModal from "./WinterOfferModal";

const STORAGE_KEY = "028import_winter_offer_seen";
const HOLD_MS = 7000;
const FADE_MS = 4000;

export default function WinterPromo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [snowVisible, setSnowVisible] = useState(false);
  const [snowFading, setSnowFading] = useState(false);
  const holdTimeoutRef = useRef(null);
  const fadeTimeoutRef = useRef(null);

  useEffect(() => {
    let seen = null;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      seen = null;
    }
    if (!seen) {
      const timer = setTimeout(() => {
        setModalOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(
    () => () => {
      clearTimeout(holdTimeoutRef.current);
      clearTimeout(fadeTimeoutRef.current);
    },
    []
  );

  const close = () => {
    setModalOpen(false);
    setSnowVisible(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage errors (e.g. private mode)
    }
    holdTimeoutRef.current = setTimeout(() => {
      setSnowFading(true);
      fadeTimeoutRef.current = setTimeout(() => {
        setSnowVisible(false);
        setSnowFading(false);
      }, FADE_MS);
    }, HOLD_MS);
  };

  return (
    <>
      {!modalOpen && snowVisible && <Snowfall fading={snowFading} fadeDuration={FADE_MS} />}
      {modalOpen && <WinterOfferModal onClose={close} />}
    </>
  );
}
