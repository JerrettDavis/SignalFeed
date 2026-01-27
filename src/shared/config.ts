const mapStyleEnv = process.env.NEXT_PUBLIC_MAP_STYLE_URL;

export const config = {
  mapStyleUrl:
    mapStyleEnv && mapStyleEnv.trim().length > 0
      ? mapStyleEnv
      : "/map-style.json",
};
