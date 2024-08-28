import React from "react";

export function useClickAway<T extends Element>(cb: (e: Event) => void): React.RefObject<T> {
  const ref = React.useRef<T>(null);
  const refCb = React.useRef(cb);

  React.useLayoutEffect(() => {
    refCb.current = cb;
  });

  React.useEffect(() => {
    const handler = (e: any) => {
      const element = ref.current;
      if (element && !element.contains(e.target)) {
        refCb.current(e);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  return ref;
}
