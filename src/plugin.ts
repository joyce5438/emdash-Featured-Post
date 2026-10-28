import { definePlugin, PluginRouteError } from "emdash";

const id = "home-featured";
const pages = [{ path: "/settings", label: "Featured-Post" }];
type Selection = { id: string; slug: string };
type State = { limit: number; selected: Selection[] };

function normalize(raw: unknown, legacy: unknown): State {
	const state = raw && typeof raw === "object" ? raw as Partial<State> : undefined;
	const old = legacy && typeof legacy === "object" ? legacy as Partial<Selection> : undefined;
	const entries = Array.isArray(state?.selected) ? state.selected : old?.id && old.slug ? [old as Selection] : [];
	return {
		limit: Number.isInteger(state?.limit) && state!.limit! >= 1 && state!.limit! <= 20 ? state!.limit! : 1,
		selected: entries.filter((entry) => typeof entry?.id === "string" && typeof entry?.slug === "string"),
	};
}

export function createPlugin() {
	return definePlugin({
		id,
		version: "0.2.0",
		capabilities: ["content:read"],
		admin: { pages },
		routes: {
			selection: {
				permission: "content:publish_any",
				handler: async (ctx) => {
					const input = ctx.input as { action?: string; id?: string } | undefined;
					if (input?.action === "get") {
						return normalize(await ctx.settings.get("state"), await ctx.settings.get("selected"));
					}
					if (!input?.id || !["select", "clear"].includes(input.action ?? "")) throw PluginRouteError.badRequest("Invalid action.");
					let entry: Selection | undefined;
					if (input.action === "select") {
						const post = await ctx.content?.get("posts", input.id);
						if (!post || post.status !== "published" || !post.slug) throw PluginRouteError.badRequest("Publish this post first.");
						entry = { id: post.id, slug: post.slug };
					}
					for (let attempt = 0; attempt < 4; attempt++) {
						const stored = await ctx.settings.getVersioned("state");
						const state = normalize(stored?.value, await ctx.settings.get("selected"));
						if (entry) {
							const index = state.selected.findIndex((item) => item.id === entry!.id);
							if (index >= 0) state.selected[index] = entry;
							else {
								if (state.selected.length >= state.limit) throw PluginRouteError.badRequest(`Featured-Post limit reached (${state.limit}). Remove another post first.`);
								state.selected.push(entry);
							}
						} else state.selected = state.selected.filter((item) => item.id !== input.id);
						if ((await ctx.settings.compareAndSet("state", stored?.revision ?? null, state)).applied) return state;
					}
					throw PluginRouteError.badRequest("Settings have changed. Refresh and try again.");
				},
			},
			settings: {
				permission: "plugins:manage",
				handler: async (ctx) => {
					const input = ctx.input as { action?: string; limit?: number } | undefined;
					if (input?.action === "get") {
						const state = normalize(await ctx.settings.get("state"), await ctx.settings.get("selected"));
						const selected = await Promise.all(state.selected.map(async (item) => {
							const post = await ctx.content?.get("posts", item.id);
							return { ...item, title: typeof post?.data?.title === "string" ? post.data.title : undefined };
						}));
						return { ...state, selected };
					}
					if (input?.action !== "save" || !Number.isInteger(input.limit) || input.limit! < 1 || input.limit! > 20) throw PluginRouteError.badRequest("Enter a whole number from 1 to 20.");
					for (let attempt = 0; attempt < 4; attempt++) {
						const stored = await ctx.settings.getVersioned("state");
						const state = normalize(stored?.value, await ctx.settings.get("selected"));
						if (input.limit! < state.selected.length) throw PluginRouteError.badRequest("Remove excess posts before lowering the limit.");
						state.limit = input.limit!;
						if ((await ctx.settings.compareAndSet("state", stored?.revision ?? null, state)).applied) return state;
					}
					throw PluginRouteError.badRequest("Settings have changed. Refresh and try again.");
				},
			},
		},
	});
}
