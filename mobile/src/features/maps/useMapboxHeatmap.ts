import { useEffect, useRef, useState } from "react";
import { File, Paths } from "expo-file-system";

let sequence = 0;
const pngPrefix = "data:image/png;base64,";

// Native ImageSource expects a file URL. Keep the locally generated heatmap in
// private cache only, and remove it when replaced or the map is closed.
export function useMapboxHeatmap(
  data: string | undefined,
  onUnavailable: () => void,
) {
  const [image, setImage] = useState<{ data: string; uri: string } | null>(
    null,
  );
  const failure = useRef(onUnavailable);
  useEffect(() => {
    failure.current = onUnavailable;
  }, [onUnavailable]);
  useEffect(() => {
    if (!data) return;
    let alive = true;
    let complete = false;
    const file = new File(
      Paths.cache,
      `vyro-map-heatmap-${Date.now()}-${++sequence}.png`,
    );
    const remove = () => {
      try {
        if (file.exists) file.delete();
      } catch {
        /* Cache is disposable. */
      }
    };
    void (async () => {
      try {
        if (!data.startsWith(pngPrefix))
          throw new Error("Invalid heatmap image");
        file.create();
        await file.write(data.slice(pngPrefix.length), { encoding: "base64" });
        complete = true;
        if (alive) setImage({ data, uri: file.uri });
        else remove();
      } catch {
        complete = true;
        remove();
        if (alive) failure.current();
      }
    })();
    return () => {
      alive = false;
      if (complete) remove();
    };
  }, [data]);
  return image && image.data === data ? image.uri : null;
}
