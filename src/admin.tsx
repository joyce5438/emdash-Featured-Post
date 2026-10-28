import { useEffect, useState } from "react";
import { apiFetch, parseApiResponse } from "@emdash-cms/admin";

type State = { limit: number; selected: { id: string; slug: string; title?: string }[] };
async function request(route: string, body: object): Promise<State> {
	const response = await apiFetch(`/_emdash/api/plugins/home-featured/${route}`, {
		method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
	});
	return parseApiResponse<State>(response, "操作失敗，請稍後再試。");
}

function HomeFeaturedPanel({ entry }: { entry: { id: string; status: string } }) {
	const [state, setState] = useState<State>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const current = state?.selected.some((item) => item.id === entry.id) ?? false;
	async function update(action: "get" | "select" | "clear") {
		setLoading(true); setError("");
		try { setState(await request("selection", { action, id: entry.id })); }
		catch (err) { setError(err instanceof Error ? err.message : "操作失敗，請稍後再試。"); }
		finally { setLoading(false); }
	}
	useEffect(() => { void update("get"); }, [entry.id]);
	return <div>
		<p style={{ margin: "0 0 12px", color: "#666", fontSize: "14px" }}>
			{current ? "已設為首頁精選文章。" : "指定後，這篇文章將顯示於首頁精選位置。"}
			{state && `（已選 ${state.selected.length} / ${state.limit} 篇）`}
		</p>
		<button type="button" disabled={loading || !state || (!current && entry.status !== "published")}
			onClick={() => void update(current ? "clear" : "select")}
			style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: "6px", background: "white", cursor: "pointer" }}>
			{loading ? "處理中…" : current ? "取消首頁精選" : "設為首頁精選"}
		</button>
		{entry.status !== "published" && !current && <p style={{ fontSize: "13px" }}>請先發布文章。</p>}
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
			if (action === "save") setMessage("設定已儲存。首頁依原有快取規則更新。");
		} catch (err) { setError(err instanceof Error ? err.message : "操作失敗，請稍後再試。"); }
		finally { setLoading(false); }
	}
	useEffect(() => { void load("get"); }, []);
	async function remove(id: string) {
		setLoading(true); setError(""); setMessage("");
		try {
			await request("selection", { action: "clear", id });
			const result = await request("settings", { action: "get" });
			setState(result); setLimit(String(result.limit));
			setMessage("已取消精選。首頁依原有快取規則更新。");
		} catch (err) { setError(err instanceof Error ? err.message : "操作失敗，請稍後再試。"); }
		finally { setLoading(false); }
	}
	const headingStyle = { fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.5rem" } as const;
	const buttonStyle = { padding: "0.5rem 1.5rem", borderRadius: 6, background: "#4a1525", color: "white", border: "none", cursor: loading ? "wait" : "pointer", fontWeight: 500 } as const;
	return <main style={{ maxWidth: 640, padding: "1.5rem 0" }}>
		<h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>首頁精選文章設定</h1>
		<form onSubmit={(event) => { event.preventDefault(); void load("save"); }}>
			<h2 style={headingStyle}>精選設定</h2>
			<label htmlFor="featured-limit" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>精選文章數量上限</label>
			<p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>最多可選 1 至 20 篇；首頁版型需支援相應數量。</p>
			<input id="featured-limit" type="number" min="1" max="20" step="1" required value={limit}
				onChange={(event) => setLimit(event.target.value)} disabled={loading || !state}
				style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.875rem", background: "transparent", color: "inherit", boxSizing: "border-box" }} />
			<p style={{ margin: "0.5rem 0 1.25rem", fontSize: "0.75rem", color: "#6b7280" }}>{state && `目前已選 ${state.selected.length} 篇。降低上限前，請先取消多出的精選文章。`}</p>
			<button type="submit" disabled={loading || !state} style={buttonStyle}>{loading ? "處理中…" : "儲存設定"}</button>
		</form>
		{state && <section style={{ marginTop: "2rem" }}>
			<h2 style={headingStyle}>已選文章</h2>
			{state.selected.length === 0 ? <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>目前沒有指定精選文章。</p> :
			<ul style={{ padding: 0, margin: 0, listStyle: "none" }}>{state.selected.map((post) => <li key={post.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid #e5e7eb" }}>
				<div style={{ minWidth: 0 }}><div style={{ fontSize: "0.875rem", fontWeight: 500, overflowWrap: "anywhere" }}>{post.title || post.slug}</div><div style={{ fontSize: "0.75rem", color: "#6b7280", overflowWrap: "anywhere" }}>{post.title ? post.slug : "文章不存在或無法讀取"}</div></div>
				<button type="button" disabled={loading} onClick={() => void remove(post.id)} style={{ flexShrink: 0, padding: "0.4rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, background: "transparent", color: "inherit", cursor: loading ? "wait" : "pointer", fontSize: "0.8rem" }}>取消精選</button>
			</li>)}</ul>}
		</section>}
		{message && <p role="status" style={{ marginTop: "1rem", color: "#16a34a", fontSize: "0.875rem" }}>{message}</p>}
		{error && <p role="alert" style={{ marginTop: "1rem", color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}
	</main>;
}

export const pages = { "/settings": FeaturedSettings };
export const contentEditorPanels = [{ id: "home-featured", title: "首頁精選文章", component: HomeFeaturedPanel, collections: ["posts"] }];
