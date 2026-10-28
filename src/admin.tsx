import { useEffect, useState } from "react";
import { apiFetch, parseApiResponse } from "@emdash-cms/admin";

type State = { limit: number; selected: { id: string; slug: string }[] };
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
			const result = await request("settings", action === "get" ? { action } : { action, limit: Number(limit) });
			setState(result); setLimit(String(result.limit));
			if (action === "save") setMessage("設定已儲存。首頁依原有快取規則更新。");
		} catch (err) { setError(err instanceof Error ? err.message : "操作失敗，請稍後再試。"); }
		finally { setLoading(false); }
	}
	useEffect(() => { void load("get"); }, []);
	async function remove(id: string) {
		setLoading(true); setError(""); setMessage("");
		try {
			const result = await request("selection", { action: "clear", id });
			setState(result); setLimit(String(result.limit));
			setMessage("已取消精選。首頁依原有快取規則更新。");
		} catch (err) { setError(err instanceof Error ? err.message : "操作失敗，請稍後再試。"); }
		finally { setLoading(false); }
	}
	return <main style={{ padding: "24px", maxWidth: "640px" }}>
		<h1>首頁精選文章設定</h1>
		<p>設定首頁精選文章的數量上限。首頁版型需要支援對應數量。</p>
		<form onSubmit={(event) => { event.preventDefault(); void load("save"); }}>
			<label htmlFor="featured-limit">精選文章數量上限</label><br />
			<input id="featured-limit" type="number" min="1" max="20" step="1" required value={limit}
				onChange={(event) => setLimit(event.target.value)} disabled={loading || !state} />
			<p>{state && `目前已選 ${state.selected.length} 篇。降低上限前，請先取消多出的精選文章。`}</p>
			<button type="submit" disabled={loading || !state}>{loading ? "處理中…" : "儲存設定"}</button>
		</form>
		{state && state.selected.length > 0 && <section>
			<h2>已選文章</h2>
			<ul>{state.selected.map((post) => <li key={post.id}>
				{post.slug} <button type="button" disabled={loading} onClick={() => void remove(post.id)}>取消精選</button>
			</li>)}</ul>
		</section>}
		{message && <p role="status">{message}</p>}
		{error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
	</main>;
}

export const pages = { "/settings": FeaturedSettings };
export const contentEditorPanels = [{ id: "home-featured", title: "首頁精選文章", component: HomeFeaturedPanel, collections: ["posts"] }];
