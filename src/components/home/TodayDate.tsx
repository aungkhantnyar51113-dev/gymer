"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getServerLabel() {
  return "";
}

export function TodayDate() {
  // Read the date as an external store so the server renders an empty label
  // while the client renders the localized date after hydration.
  const today = useSyncExternalStore(subscribe, getTodayLabel, getServerLabel);

  return <p className="text-xs text-muted">{today || "\u00a0"}</p>;
}
