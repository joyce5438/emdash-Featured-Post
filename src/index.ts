import type { PluginDescriptor } from "emdash";

/** Register this trusted native plugin in the EmDash integration. */
export function featuredPostPlugin(): PluginDescriptor {
	return {
		id: "home-featured",
		version: "0.2.0",
		format: "native",
		entrypoint: "emdash-featured-post/plugin",
		adminEntry: "emdash-featured-post/admin",
		adminPages: [{ path: "/settings", label: "首頁精選文章" }],
		capabilities: ["content:read"],
	};
}

export default featuredPostPlugin;
