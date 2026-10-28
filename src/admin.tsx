import { useEffect, useState } from "react";
import { apiFetch, parseApiResponse } from "@emdash-cms/admin";

type Selection = { id: string; slug: string } | null;

function HomeFeaturedPanel({ entry }: { entry: { id: string; status: string } }) {
	const [selected, setSelected] = useState<Selection>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const current = selected?.id === entry.id;

	async function update(action: "get" | "select" | "clear") {
		setLoading(true);
		setError("");
		try {
			const response = await apiFetch("/_emdash/api/plugins/home-featured/selection", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action, id: entry.id }),
			});
			const result = await parseApiResponse<{ selected?: Selection }>(response, "無法更新首頁精選文章");
			setSelected(result.selected ?? null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "操作失敗，請稍後再試。");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { void update("get"); }, [entry.id]);

	return <div>
		<p style={{ margin: "0 0 12px", color: "#666", fontSize: "14px" }}>
			{current ? "這篇文章目前顯示於首頁精選位置。" : "指定後，這篇文章將顯示於首頁精選位置。"}
		</p>
		<button type="button" disabled={loading || (!current && entry.status !== "published")}
			onClick={() => void update(current ? "clear" : "select")}
			style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: "6px", background: "white", cursor: "pointer" }}>
			{loading ? "處理中…" : current ? "取消首頁精選" : "設為首頁精選"}
		</button>
		{entry.status !== "published" && !current && <p style={{ fontSize: "13px" }}>請先發布文章。</p>}
		{error && <p role="alert" style={{ color: "#b42318", fontSize: "13px" }}>{error}</p>}
	</div>;
}

export const contentEditorPanels = [{
	id: "home-featured",
	title: "首頁精選文章",
	component: HomeFeaturedPanel,
	collections: ["posts"],
}];
