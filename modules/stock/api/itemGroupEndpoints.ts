const RESOURCE_BASE = "/resource/Item%20Group";

export const itemGroupEndpoints = {
  list: RESOURCE_BASE,
  detail: (name: string) => `${RESOURCE_BASE}/${encodeURIComponent(name)}`
};
