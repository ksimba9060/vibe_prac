import { useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { StatusBar } from "./StatusBar";

// 402 × 874 logical display; scale the complete device to fit the browser.
const deviceWidth = 426,
  deviceHeight = 898;
export function PhoneShell({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const resize = () => {
      const gutter = window.innerWidth < 500 ? 24 : 48;
      setScale(
        Math.min(
          1,
          (window.innerWidth - gutter) / deviceWidth,
          (window.innerHeight - gutter) / deviceHeight,
        ),
      );
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return (
    <div className="device-stage">
      <div
        className="device-footprint"
        style={{ width: deviceWidth * scale, height: deviceHeight * scale }}
      >
        <section
          className="phone-device"
          aria-label="Healeat 아이폰 화면"
          style={{ transform: `scale(${scale})` }}
        >
          <div className="phone-buttons" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="phone-screen">
            <div className="phone-island" aria-hidden="true">
              <span />
            </div>
            <StatusBar />
            <div id="phone-scroll" className="phone-scroll">
              {children}
            </div>
            <div id="phone-navigation" />
            <div id="phone-overlays" />
            <div id="toast" role="status" />
            <div className="phone-home-indicator" aria-hidden="true" />
          </div>
        </section>
      </div>
    </div>
  );
}
