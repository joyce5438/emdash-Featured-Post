import { definePlugin } from "emdash";

const id = "home-featured";

export function createPlugin() {
	return definePlugin({
		id,
		version: "0.1.0",
		capabilities: ["content:read"],
		routes: {
			selection: {
				permission: "content:publish_any",
				handler: async (ctx) => {
					const input = ctx.input as { action?: string; id?: string } | undefined;
					if (input?.action === "select" && typeof input.id === "string") {
						const entry = await ctx.content?.get("posts", input.id);
						if (!entry || entry.status !== "published" || !entry.slug) throw new Error("請先發佈文章。");
						await ctx.settings.set("selected", { id: entry.id, slug: entry.slug });
					} else if (input?.action === "clear" && typeof input.id === "string") {
						const selected = await ctx.settings.get("selected") as { id?: string } | undefined;
						if (selected?.id === input.id) await ctx.settings.delete("selected");
					} else if (input?.action !== "get") {
						throw new Error("無效的操作。");
					}
					return { selected: await ctx.settings.get("selected") };
				},
			},
		},
	});
}
