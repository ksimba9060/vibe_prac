import { useEffect, useState } from "react";

type DeviceBattery = EventTarget & { level: number; charging: boolean };
type BatteryNavigator = Navigator & {
  getBattery?: () => Promise<DeviceBattery>;
};
const clock = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

export function StatusBar() {
  const [time, setTime] = useState(clock);
  const [battery, setBattery] = useState<{
    percent: number;
    charging: boolean;
  } | null>(null);
  useEffect(() => {
    const update = () => setTime(clock());
    const timer = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  useEffect(() => {
    let active = true;
    let cleanup = () => {};
    const getBattery = (navigator as BatteryNavigator).getBattery;
    if (getBattery) {
      void getBattery
        .call(navigator)
        .then((device) => {
          if (!active) return;
          const update = () => {
            if (active && Number.isFinite(device.level))
              setBattery({
                percent: Math.round(
                  Math.max(0, Math.min(1, device.level)) * 100,
                ),
                charging: device.charging,
              });
          };
          update();
          device.addEventListener("levelchange", update);
          device.addEventListener("chargingchange", update);
          cleanup = () => {
            device.removeEventListener("levelchange", update);
            device.removeEventListener("chargingchange", update);
          };
        })
        .catch(() => {
          /* Browsers without battery access keep an unknown indicator. */
        });
    }
    return () => {
      active = false;
      cleanup();
    };
  }, []);
  const label = battery
    ? `배터리 ${battery.percent}%${battery.charging ? ", 충전 중" : ""}`
    : "배터리 잔량을 제공하지 않는 브라우저";
  return (
    <div className="iphone-statusbar" aria-label="기기 상태바">
      <time className="statusbar-time" aria-label={`현재 시간 ${time}`}>
        {time}
      </time>
      <div className="statusbar-indicators">
        <svg
          className="statusbar-signal"
          width="18"
          height="14"
          viewBox="0 0 18 14"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="0" y="9" width="3" height="5" rx=".8" />
          <rect x="5" y="6" width="3" height="8" rx=".8" />
          <rect x="10" y="3" width="3" height="11" rx=".8" />
          <rect x="15" y="0" width="3" height="14" rx=".8" />
        </svg>
        <svg
          width="18"
          height="14"
          viewBox="0 0 20 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M2 4.5a13 13 0 0 1 16 0M5 8a8 8 0 0 1 10 0M8 11.5a3.2 3.2 0 0 1 4 0" />
          <circle cx="10" cy="14" r="1" fill="currentColor" stroke="none" />
        </svg>
        <span
          className={
            "statusbar-battery" +
            (battery?.charging
              ? " charging"
              : battery && battery.percent <= 20
                ? " low"
                : "")
          }
          role="img"
          aria-label={label}
          title={label}
        >
          <svg width="29" height="15" viewBox="0 0 29 15" aria-hidden="true">
            <rect
              x=".5"
              y=".5"
              width="24"
              height="14"
              rx="3.5"
              stroke="currentColor"
              fill="none"
              opacity=".45"
            />
            <path d="M26 5v5c2-.4 2-4.6 0-5" fill="currentColor" opacity=".5" />
            {battery ? (
              <rect
                x="2"
                y="2"
                width={(21 * battery.percent) / 100}
                height="11"
                rx="2"
                fill="currentColor"
              />
            ) : (
              <path
                d="M9 7.5h7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
            {battery?.charging && (
              <path
                d="m14 2-5 6h4l-2 5 6-7h-4z"
                fill="var(--bg)"
                stroke="currentColor"
                strokeWidth=".4"
              />
            )}
          </svg>
        </span>
      </div>
    </div>
  );
}
