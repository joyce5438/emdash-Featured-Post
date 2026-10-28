import type { PluginDescriptor } from "emdash";

/** Register this trusted native plugin in the EmDash integration. */
export function featuredPostPlugin(): PluginDescriptor {
	return {
		id: "home-featured",
		version: "0.1.0",
		format: "native",
		entrypoint: "emdash-featured-post/plugin",
		adminEntry: "emdash-featured-post/admin",
		capabilities: ["content:read"],
	};
}

export default featuredPostPlugin;
