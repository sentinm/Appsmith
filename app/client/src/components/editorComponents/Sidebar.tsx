import classNames from "classnames";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import { PanelStack } from "@blueprintjs/core";
import React, { memo, useEffect, useRef, useCallback, useState } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import Explorer from "pages/Editor/Explorer";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { getExplorerPinned } from "selectors/explorerSelector";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import OnboardingStatusbar from "pages/Editor/FirstTimeUserOnboarding/Statusbar";

type Props = {
  width: number;
  onWidthChange: (width: number) => void;
};

export const EntityExplorerSidebar = memo((props: Props) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pinned = useSelector(getExplorerPinned);
  const [active, setActive] = useState(true);
  const resizer = useHorizontalResize(sidebarRef, props.onWidthChange);
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );
  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  // registering event listeners
  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [active, pinned]);

  /**
   * passing the event to touch move on mouse move
   *
   * @param event
   */
  const onMouseMove = (event: MouseEvent) => {
    const eventWithTouches = Object.assign({}, event, {
      touches: [{ clientX: event.clientX, clientY: event.clientY }],
    });
    onTouchMove(eventWithTouches);
  };

  /**
   * calculate the new width based on the pixel moved
   *
   * @param event
   */
  const onTouchMove = (
    event:
      | TouchEvent
      | (MouseEvent & { touches: { clientX: number; clientY: number }[] }),
  ) => {
    if (!pinned && !active) {
      const current = event.touches[0].clientX;

      if (current <= 30) {
        setActive(true);
      }
    }
  };

  /**
   * if the sidebar is not pinned and we are not resizing,
   * sets the active
   */
  const onMouseLeave = useCallback(() => {
    if (!pinned && !resizer.resizing) {
      setActive(false);
    }
  }, [active, setActive, pinned, resizer.resizing]);

  // eslint-disable-next-line
  console.log({ pinned, active });

  return (
    <div
      className={classNames({
        "transform transition flex h-full z-3": true,
        "relative ": pinned,
        "-translate-x-full": !pinned && !active,
        fixed: !pinned,
      })}
      onMouseLeave={onMouseLeave}
    >
      {/* SIDEBAR */}
      <div
        className="t--sidebar p-0  overflow-y-auto bg-trueGray-800 text-white h-full min-w-48 max-w-96 scrollbar-thumb-red-300 hover:scrollbar-thumb-red-400"
        ref={sidebarRef}
        style={{ width: props.width }}
      >
        {(enableFirstTimeUserOnboarding ||
          isFirstTimeUserOnboardingComplete) && <OnboardingStatusbar />}
        <PanelStack
          className="h-full"
          initialPanel={{
            component: Explorer,
          }}
          showPanelHeader={false}
        />
      </div>
      {/* RESIZER */}
      <div
        className="w-2 -mr-1 group z-4 cursor-ew-resize h-full"
        onMouseDown={resizer.onMouseDown}
        onTouchEnd={resizer.onMouseUp}
        onTouchStart={resizer.onTouchStart}
        style={{ left: !pinned && !active ? 0 : props.width }}
      >
        <div
          className={classNames({
            "w-1 h-full bg-transparent group-hover:bg-blue-500 transform transition": true,
            "bg-blue-500": resizer.resizing,
          })}
        />
      </div>
    </div>
  );
});

EntityExplorerSidebar.displayName = "EntityExplorerSidebar";

export default Sentry.withProfiler(EntityExplorerSidebar);
