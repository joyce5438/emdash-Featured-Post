import { useEffect, useState } from "react";
import { apiFetch, parseApiResponse } from "@emdash-cms/admin";

type State = { limit: number; selected: { id: string; slug: string; title?: string }[] };
async function request(route: string, body: object): Promise<State> {
	const response = await apiFetch(`/_emdash/api/plugins/home-featured/${route}`, {
		method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
	});
	return parseApiResponse<State>(response, "Something went wrong. Please try again.");
}

function HomeFeaturedPanel({ entry }: { entry: { id: string; status: string } }) {
	const [state, setState] = useState<State>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const current = state?.selected.some((item) => item.id === entry.id) ?? false;
	async function update(action: "get" | "select" | "clear") {
		setLoading(true); setError("");
		try { setState(await request("selection", { action, id: entry.id })); }
		catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
		finally { setLoading(false); }
	}
	useEffect(() => { void update("get"); }, [entry.id]);
	return <div>
		<p style={{ margin: "0 0 12px", color: "#666", fontSize: "14px" }}>
			{current ? "This post is set as a Featured-Post." : "Select this post to feature it on the homepage."}
			{state && ` (${state.selected.length} / ${state.limit} selected)`}
		</p>
		<button type="button" disabled={loading || !state || (!current && entry.status !== "published")}
			onClick={() => void update(current ? "clear" : "select")}
			style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: "6px", background: "white", cursor: "pointer" }}>
			{loading ? "Working…" : current ? "Remove from Featured-Post" : "Set as Featured-Post"}
		</button>
		{entry.status !== "published" && !current && <p style={{ fontSize: "13px" }}>Publish this post first.</p>}
		{error && <p role="alert" style={{ color: "#b42318", fontSize: "13px" }}>{error}</p>}
	</div>;
}

function FeaturedSettings() {
	const [state, setState] = useState<State>();
	const [limit, setLimit] = useState("1");
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	async function load(action: "get" | "save") {
		setLoading(true); setError(""); setMessage("");
		try {
			if (action === "save") await request("settings", { action, limit: Number(limit) });
			const result = await request("settings", { action: "get" });
			setState(result); setLimit(String(result.limit));
			if (action === "save") setMessage("Settings saved. The homepage updates according to its existing cache policy.");
		} catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
		finally { setLoading(false); }
	}
	useEffect(() => { void load("get"); }, []);
	async function remove(id: string) {
		setLoading(true); setError(""); setMessage("");
		try {
			await request("selection", { action: "clear", id });
			const result = await request("settings", { action: "get" });
			setState(result); setLimit(String(result.limit));
			setMessage("Post removed. The homepage updates according to its existing cache policy.");
		} catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
		finally { setLoading(false); }
	}
	const headingStyle = { fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem" } as const;
	const buttonStyle = { padding: "0.5rem 1.5rem", borderRadius: 6, background: "#4a1525", color: "white", border: "none", cursor: loading ? "wait" : "pointer", fontWeight: 500 } as const;
	return <main style={{ maxWidth: 640, padding: "1.5rem 0" }}>
		<h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Featured-Post Settings</h1>
		<form onSubmit={(event) => { event.preventDefault(); void load("save"); }}>
			<h2 style={headingStyle}>General</h2>
			<label htmlFor="featured-limit" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>Maximum featured posts</label>
			<p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>Choose from 1 to 20. Your homepage layout must support the selected number.</p>
			<input id="featured-limit" type="number" min="1" max="20" step="1" required value={limit}
				onChange={(event) => setLimit(event.target.value)} disabled={loading || !state}
				style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.875rem", background: "transparent", color: "inherit", boxSizing: "border-box" }} />
			<p style={{ margin: "0.5rem 0 1.25rem", fontSize: "0.75rem", color: "#6b7280" }}>{state && `${state.selected.length} selected. Remove excess posts before lowering the limit.`}</p>
			<button type="submit" disabled={loading || !state} style={buttonStyle}>{loading ? "Working…" : "Save settings"}</button>
		</form>
		{state && <section style={{ marginTop: "2rem" }}>
			<h2 style={headingStyle}>Selected posts</h2>
			{state.selected.length === 0 ? <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No posts selected yet.</p> :
			<ul style={{ padding: 0, margin: 0, listStyle: "none" }}>{state.selected.map((post) => <li key={post.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid #e5e7eb" }}>
				<div style={{ minWidth: 0 }}><div style={{ fontSize: "0.875rem", fontWeight: 500, overflowWrap: "anywhere" }}>{post.title || post.slug}</div><div style={{ fontSize: "0.75rem", color: "#6b7280", overflowWrap: "anywhere" }}>{post.title ? post.slug : "Post not found or unavailable"}</div></div>
				<button type="button" disabled={loading} onClick={() => void remove(post.id)} style={{ flexShrink: 0, padding: "0.4rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, background: "transparent", color: "inherit", cursor: loading ? "wait" : "pointer", fontSize: "0.8rem" }}>Remove</button>
			</li>)}</ul>}
		</section>}
		{message && <p role="status" style={{ marginTop: "1rem", color: "#16a34a", fontSize: "0.875rem" }}>{message}</p>}
		{error && <p role="alert" style={{ marginTop: "1rem", color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}
	</main>;
}

export const pages = { "/settings": FeaturedSettings };
export const contentEditorPanels = [{ id: "home-featured", title: "Featured-Post", component: HomeFeaturedPanel, collections: ["posts"] }];
