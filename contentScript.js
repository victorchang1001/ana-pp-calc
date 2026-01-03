let manualBaseMiles = null; // kept for backward compatibility
let baseMilesDirect = null;
let baseMilesLeg1 = null;
let baseMilesLeg2 = null;

function getBaseMilesFromFlex(span) {
	const row = span.closest("tr");
	if (!row) return null;

	if (row.dataset.baseMiles) {
		const cached = parseInt(row.dataset.baseMiles, 10);
		if (!Number.isNaN(cached)) return cached;
	}

	const rowSpans = row.querySelectorAll("span.hoverInfo");
	// 1) Prefer explicit フレックス economy fare if present
	for (const s of rowSpans) {
		const text = s.textContent || "";
		if (!/フレックス/.test(text)) continue;
		const match = text.match(/(\d[\d,]*)マイル/);
		if (!match) continue;
		const baseMiles = parseInt(match[1].replace(/,/g, ""), 10);
		if (!Number.isNaN(baseMiles)) {
			row.dataset.baseMiles = String(baseMiles);
			return baseMiles;
		}
	}

	// 2) Otherwise, derive from any known fare rule (works for premium)
	for (const s of rowSpans) {
		const text = s.textContent || "";
		const match = text.match(/(\d[\d,]*)マイル/);
		if (!match) continue;

		const miles = parseInt(match[1].replace(/,/g, ""), 10);
		if (Number.isNaN(miles)) continue;

		const rule = getDomesticFareRule(text);
		if (!rule || !rule.rate) continue;

		const baseMiles = Math.round(miles / rule.rate);
		if (!Number.isNaN(baseMiles) && baseMiles > 0) {
			row.dataset.baseMiles = String(baseMiles);
			return baseMiles;
		}
	}

	return null;
}

function getSearchDepartureDate() {
	try {
		const input = document.getElementById("criteo_departure_date");
		if (input && input.value && /^\d{8}$/.test(input.value)) {
			const v = input.value;
			const y = Number(v.slice(0, 4));
			const m = Number(v.slice(4, 6));
			const d = Number(v.slice(6, 8));
			const date = new Date(y, m - 1, d);
			if (!Number.isNaN(date.getTime())) return date;
		}
	} catch (e) {
		// ignore
	}

	try {
		const asw = window.Asw;
		const dep =
			asw &&
			asw.ApiRequestParam &&
			asw.ApiRequestParam.post &&
			asw.ApiRequestParam.post.departureDate;
		if (dep && /^\d{4}-\d{2}-\d{2}$/.test(dep)) {
			const parts = dep.split("-");
			const y = Number(parts[0]);
			const m = Number(parts[1]);
			const d = Number(parts[2]);
			const date = new Date(y, m - 1, d);
			if (!Number.isNaN(date.getTime())) return date;
		}
	} catch (e) {
		// ignore
	}

	return null;
}

function isNewFareSystemContext() {
	const NEW_SYSTEM_START = new Date(2026, 4, 19); // 2026-05-19
	const depDate = getSearchDepartureDate();

	if (depDate) {
		return depDate >= NEW_SYSTEM_START;
	}

	if (
		typeof location !== "undefined" &&
		location.hostname &&
		location.hostname.indexOf("aswbe.ana.co.jp") !== -1
	) {
		return true;
	}

	const hintSpan = document.querySelector("span.u-visually-hidden");
	if (hintSpan) {
		const txt = hintSpan.textContent || "";
		if (/運賃シンプル|運賃スタンダード|運賃フレックス/.test(txt)) {
			return true;
		}
	}

	return false;
}

function getDomesticFareRule(text) {
	const t = text || "";

	if (isNewFareSystemContext()) {
		let cabin = "";
		let fareName = "";
		const m = t.match(/クラス([^、]+)、運賃([^\s、]+)/);
		if (m) {
			cabin = m[1];
			fareName = m[2];
		}

		const isFirst =
			/ファーストクラス/.test(cabin) || /ファーストクラス|First/i.test(t);
		const isEconomy =
			/エコノミークラス/.test(cabin) ||
			/エコノミークラス|エコノミー|普通席/.test(t);

		const has = (re) => re.test(t) || re.test(fareName);

		// 新運賃 A–P
		if (has(/フレックス|Biz|カード優待|ANAカード優待/i) && isFirst) {
			return { type: "A", code: "A", rate: 1.5, boarding: 400 };
		}

		if ((has(/スタンダード/) || has(/株主優待/)) && isFirst) {
			return { type: "B", code: "B", rate: 1.3, boarding: 400 };
		}

		if (has(/シンプル/) && isFirst) {
			return { type: "C", code: "C", rate: 1.2, boarding: 400 };
		}

		if (has(/フレックス|Biz|カード優待|ANAカード優待/i) && isEconomy) {
			return { type: "D", code: "D", rate: 1.0, boarding: 400 };
		}

		if (has(/島民割引/)) {
			return { type: "E", code: "E", rate: 1.0, boarding: 0 };
		}

		if (has(/株主優待/) && isEconomy) {
			return { type: "G", code: "G", rate: 0.8, boarding: 400 };
		}

		if (has(/スタンダード/)) {
			return { type: "H", code: "H", rate: 0.8, boarding: 200 };
		}

		if (has(/シンプル/)) {
			return { type: "I", code: "I", rate: 0.7, boarding: 100 };
		}

		if (has(/セール|ユース|シニア|個人包括旅行運賃|包括団体旅行運賃/i)) {
			return { type: "J", code: "J", rate: 0.5, boarding: 0 };
		}

		if (has(/包括旅行割引運賃|ITE/i)) {
			return { type: "K", code: "K", rate: 0.3, boarding: 0 };
		}

		if (has(/ブッキングクラス\s*[FA]/i)) {
			return { type: "L", code: "L", rate: 1.5, boarding: 0 };
		}

		if (has(/ブッキングクラス\s*[YBM]/i)) {
			return { type: "M", code: "M", rate: 1.0, boarding: 0 };
		}

		if (has(/ブッキングクラス\s*[UHQ]/i)) {
			return { type: "N", code: "N", rate: 0.7, boarding: 0 };
		}

		if (has(/ブッキングクラス\s*[VWS]/i)) {
			return { type: "O", code: "O", rate: 0.5, boarding: 0 };
		}

		if (has(/ブッキングクラス\s*[LK]/i)) {
			return { type: "P", code: "P", rate: 0.3, boarding: 0 };
		}

		return null;
	}

	const rules = [
		// 1: プレミアム運賃系（150%, +400）
		{
			type: 1,
			code: "F1",
			pattern:
				/プレミアム運賃|プレミアムビジネスきっぷ|プレミアム障がい者割引(?!株主)|プレミアム小児運賃|Premium Fare/i,
			rate: 1.5,
			boarding: 400,
		},
		// 2: プレミアム割引系（130%, +400）
		{
			type: 2,
			code: "F2",
			pattern:
				/バリュープレミアム3|スーパーバリュープレミアム28|VALUE PREMIUM 3|SUPER VALUE PREMIUM 28|プレミアム株主優待割引/i,
			rate: 1.25,
			boarding: 400,
		},
		// 3: フレックス / ビジネスきっぷ等（100%, +400）
		{
			type: 3,
			code: "F3",
			pattern:
				/フレックス|ビジネスきっぷ|Biz|小児運賃|障がい者割引運賃|介護割引/i,
			rate: 1.0,
			boarding: 400,
		},
		// 4: 各種アイきっぷ（100%, +0）
		{ type: 4, code: "F4", pattern: /アイきっぷ/, rate: 1.0, boarding: 0 },
		// 7: スーパーバリュー / いっしょにマイル割（75%, +0）
		{
			type: 7,
			code: "F7",
			pattern:
				/スーパーバリュー|SUPER VALUE(?! PREMIUM| TRANSIT)|いっしょにマイル割/i,
			rate: 0.75,
			boarding: 0,
		},
		// 5: バリュー / 株主優待（75%, +400）
		{
			type: 5,
			code: "F5",
			pattern:
				/ANA VALUE(?! PREMIUM| TRANSIT)|バリュー|株主優待割引|VALUE 1|VALUE 3|VALUE 7/i,
			rate: 0.75,
			boarding: 400,
		},
		// 6: トランジット系（75%, +200）
		{
			type: 6,
			code: "F6",
			pattern: /VALUE TRANSIT|SUPER VALUE TRANSIT/i,
			rate: 0.75,
			boarding: 200,
		},
		// 8: セール / 特別割引（50%, +0）
		{
			type: 8,
			code: "F8",
			pattern:
				/スマートU25|スマートシニア空割|SUPER VALUE SALE|個人包括旅行運賃|包括旅行割引運賃/i,
			rate: 0.5,
			boarding: 0,
		},
	];

	for (const rule of rules) {
		if (rule.pattern.test(t)) {
			return rule;
		}
	}

	return null;
}

function getDomesticFareDefinitions() {
	if (isNewFareSystemContext()) {
		return [
			{
				type: "A",
				code: "A",
				label: "フレックス/Biz/カード優待(First)",
				rate: 1.5,
				boarding: 400,
			},
			{
				type: "B",
				code: "B",
				label: "スタンダード/株主優待(First)",
				rate: 1.3,
				boarding: 400,
			},
			{
				type: "C",
				code: "C",
				label: "シンプル(First)",
				rate: 1.2,
				boarding: 400,
			},
			{
				type: "D",
				code: "D",
				label: "フレックス/Biz/カード優待(Eco)",
				rate: 1.0,
				boarding: 400,
			},
			{
				type: "E",
				code: "E",
				label: "島民割引(Eco)",
				rate: 1.0,
				boarding: 0,
			},
			{
				type: "G",
				code: "G",
				label: "株主優待(Eco)",
				rate: 0.8,
				boarding: 400,
			},
			{
				type: "H",
				code: "H",
				label: "スタンダード(Eco)",
				rate: 0.8,
				boarding: 200,
			},
			{
				type: "I",
				code: "I",
				label: "シンプル(Eco)",
				rate: 0.7,
				boarding: 100,
			},
			{
				type: "J",
				code: "J",
				label: "セール/ユース/シニア/APIT/IITA",
				rate: 0.5,
				boarding: 0,
			},
			{
				type: "K",
				code: "K",
				label: "包括旅行割引(ITE)",
				rate: 0.3,
				boarding: 0,
			},
			{
				type: "L",
				code: "L",
				label: "国際接続First(F/A)",
				rate: 1.5,
				boarding: 0,
			},
			{
				type: "M",
				code: "M",
				label: "国際接続Eco(Y/B/M)",
				rate: 1.0,
				boarding: 0,
			},
			{
				type: "N",
				code: "N",
				label: "国際接続Eco(U/H/Q)",
				rate: 0.7,
				boarding: 0,
			},
			{
				type: "O",
				code: "O",
				label: "国際接続Eco(V/W/S)",
				rate: 0.5,
				boarding: 0,
			},
			{
				type: "P",
				code: "P",
				label: "国際接続Eco(L/K)",
				rate: 0.3,
				boarding: 0,
			},
		];
	}

	return [
		{
			type: 1,
			code: "F1",
			label: "プレミアム運賃系",
			rate: 1.5,
			boarding: 400,
		},
		{
			type: 2,
			code: "F2",
			label: "プレミアム割引系",
			rate: 1.25,
			boarding: 400,
		},
		{
			type: 3,
			code: "F3",
			label: "フレックス・ビジネスきっぷ系",
			rate: 1.0,
			boarding: 400,
		},
		{ type: 4, code: "F4", label: "アイきっぷ", rate: 1.0, boarding: 0 },
		{
			type: 5,
			code: "F5",
			label: "バリュー・株主優待系",
			rate: 0.75,
			boarding: 400,
		},
		{
			type: 6,
			code: "F6",
			label: "トランジット系",
			rate: 0.75,
			boarding: 200,
		},
		{
			type: 7,
			code: "F7",
			label: "スーパーバリュー系",
			rate: 0.75,
			boarding: 0,
		},
		{
			type: 8,
			code: "F8",
			label: "セール・特別割引系",
			rate: 0.5,
			boarding: 0,
		},
	];
}

function calculatePremiumPoints(baseMiles, miles, fareText) {
	if (!baseMiles) return null;

	const routeMultiplier = 2; // domestic sector factor
	const defaultBoardingPoints = 400;

	const rule = getDomesticFareRule(fareText);
	if (rule) {
		const pp = Math.floor(
			baseMiles * rule.rate * routeMultiplier + rule.boarding
		);
		if (!Number.isFinite(pp)) return null;
		const code = rule.code || (rule.type != null ? `F${rule.type}` : "?");
		return {
			pp,
			debug: `${code}: base=${baseMiles}, rate=${(
				rule.rate * 100
			).toFixed(0)}%, bonus=${rule.boarding}, miles=${miles ?? "-"}`,
		};
	}

	if (!miles) return null;

	const accrualRate = miles / baseMiles;
	const pp = Math.floor(
		baseMiles * accrualRate * routeMultiplier + defaultBoardingPoints
	);
	if (!Number.isFinite(pp)) return null;
	return {
		pp,
		debug: `F?: base=${baseMiles}, miles=${miles}, rate≈${(
			accrualRate * 100
		).toFixed(1)}%, bonus=${defaultBoardingPoints}`,
	};
}

function injectMilesAndPointsIntoPrice() {
	if (isNewFareSystemContext()) {
		annotateNewFarePrices();
		return;
	}

	const spans = document.querySelectorAll("span.hoverInfo");

	spans.forEach((span) => {
		const text = span.textContent || "";
		const milesMatch = text.match(/(\d[\d,]*)マイル/);
		if (!milesMatch) return;

		const milesNumber = parseInt(milesMatch[1].replace(/,/g, ""), 10);
		if (Number.isNaN(milesNumber)) return;

		const baseMiles = getBaseMilesFromFlex(span);
		const ppInfo = calculatePremiumPoints(baseMiles, milesNumber, text);
		if (!ppInfo) return;
		const premiumPoints = ppInfo.pp;

		const container = span.parentElement;
		if (!container) return;

		const priceEl =
			container.querySelector("em.pliceSmallJa") ||
			container.parentElement?.querySelector("em.pliceSmallJa");

		if (!priceEl) return;

		const original = priceEl.textContent || "";
		const priceMatch = original.match(/(\d[\d,]*)円/);
		if (!priceMatch || premiumPoints == null) return;

		const priceNumber = parseInt(priceMatch[1].replace(/,/g, ""), 10);
		if (Number.isNaN(priceNumber) || premiumPoints === 0) return;

		const unit = priceNumber / premiumPoints;
		const unitText = `${unit.toFixed(1)}円/PP`;
		const highlight = unit < 10;
		const debugText = ppInfo.debug;

		const line1 = `${priceNumber.toLocaleString()}円`;
		const line2 = `${premiumPoints.toLocaleString()} PP`;
		const line3 = highlight
			? `<span style="color: red; font-weight: bold;">${unitText}</span>`
			: unitText;

		priceEl.innerHTML = `${line1}<br>${line2}<br>${line3}`;
		if (debugText) {
			priceEl.title = debugText;
		}

		const cell = span.closest("td");
		if (cell) {
			if (highlight) {
				cell.style.backgroundColor = "#fff8dc"; // light yellow
			}
			if (debugText) {
				cell.title = debugText;
			}
		}
	});
}

function annotateNewFarePrices() {
	const priceEmElements = document.querySelectorAll(
		".p-vacant-seat01__cell .p-vacant-seat01__btn-price em"
	);

	priceEmElements.forEach((em) => {
		const cell = em.closest(".p-vacant-seat01__cell");
		if (!cell) return;

		// Prefer the visually-hidden span that actually describes
		// "フライト..., クラス..., 運賃..."
		const hiddenSpans = cell.querySelectorAll("span.u-visually-hidden");
		let hiddenText = "";
		hiddenSpans.forEach((span) => {
			const txt = span.textContent || "";
			if (/クラス.+運賃/.test(txt)) {
				hiddenText = txt;
			}
		});

		if (!hiddenText && hiddenSpans[0]) {
			hiddenText = hiddenSpans[0].textContent || "";
		}

		if (!hiddenText) return;

		const rule = getDomesticFareRule(hiddenText);
		if (!rule || !rule.code) return;

		if (!em.dataset.anaPpOriginalHtml) {
			em.dataset.anaPpOriginalHtml = em.innerHTML;
		}
		const baseHtml = em.dataset.anaPpOriginalHtml;

		const extraLines = [];
		let highlightUnit = false;

		const directBase = baseMilesDirect;
		const legBase1 = baseMilesLeg1;
		const legBase2 = baseMilesLeg2;
		let priceNumber = null;
		const numSpan = em.querySelector(".p-flight-container__fare-price-num");
		if (numSpan) {
			const numText = (numSpan.textContent || "").replace(/,/g, "");
			const parsed = parseInt(numText, 10);
			if (!Number.isNaN(parsed)) {
				priceNumber = parsed;
			}
		}

		// 判定: このフライトが乗継かどうか
		let isTransfer = false;
		const flightItem =
			cell.closest(".p-vacant-seat01__item") ||
			cell.closest(".js-flight-item");
		if (flightItem) {
			const durationNode = flightItem.querySelector(
				".c-flight-plan__time.c-flight-plan__item-6"
			);
			if (durationNode) {
				const txt = durationNode.textContent || "";
				if (/乗継/.test(txt)) {
					isTransfer = true;
				}
			}
		}

		// 適用ボタンは直行便のみ対象にする:
		// 乗継便の計算には legBase1 / legBase2 が必須。
		const useDirectBase = !isTransfer ? directBase : null;

		if (priceNumber && (useDirectBase || (isTransfer && legBase1 && legBase2))) {
			const routeMultiplier = 2;

			if (isTransfer && legBase1 && legBase2) {
				const pp1 = Math.floor(
					legBase1 * rule.rate * routeMultiplier + rule.boarding
				);
				const pp2 = Math.floor(
					legBase2 * rule.rate * routeMultiplier + rule.boarding
				);
				const totalPp = pp1 + pp2;

				if (Number.isFinite(totalPp) && totalPp > 0) {
					const unit = priceNumber / totalPp;
					extraLines.push(
						`${pp1.toLocaleString()}PP + ${pp2.toLocaleString()}PP = ${totalPp.toLocaleString()}PP`
					);
					if (Number.isFinite(unit)) {
						extraLines.push(`${unit.toFixed(1)}円/PP`);
						if (unit < 10) {
							highlightUnit = true;
						}
					}
				}
			} else if (useDirectBase) {
				const pp = Math.floor(
					useDirectBase * rule.rate * routeMultiplier + rule.boarding
				);
				if (Number.isFinite(pp) && pp > 0) {
					const unit = priceNumber / pp;
					extraLines.push(`${pp.toLocaleString()}PP`);
					if (Number.isFinite(unit)) {
						extraLines.push(`${unit.toFixed(1)}円/PP`);
						if (unit < 10) {
							highlightUnit = true;
						}
					}
				}
			}
		} else {
			const ratePercent = (rule.rate * 100).toFixed(0);
			extraLines.push(
				`${rule.code}: base × ${ratePercent}% × 2 + ${rule.boarding}`
			);
		}

		let html = baseHtml;
		if (extraLines.length) {
			html +=
				"<br>" +
				extraLines
					.map((txt, idx) => {
						const isUnitLine =
							highlightUnit &&
							(useDirectBase || (isTransfer && legBase1 && legBase2)) &&
							priceNumber &&
							idx === 1;
						const style = isUnitLine
							? "font-size:13px;color:red;font-weight:bold;"
							: "font-size:13px;color:#333;";
						return `<span class="ana-pp-helper-fare-info" style="${style}">${txt}</span>`;
					})
					.join("<br>");
		}

		em.innerHTML = html;

		if (highlightUnit && cell) {
			cell.style.backgroundColor = "#fff8dc"; // light yellow
		}
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		injectMilesAndPointsIntoPrice();
		setupPpMutationObserver();
		createPpReferenceTable();
		createNewFareInlinePpControls();
	});
} else {
	injectMilesAndPointsIntoPrice();
	setupPpMutationObserver();
	createPpReferenceTable();
	createNewFareInlinePpControls();
}

let ppRecalcTimer = null;

function setupPpMutationObserver() {
	if (window.__anaPpObserverInstalled) return;
	window.__anaPpObserverInstalled = true;

	const target =
		document.querySelector(".availabilityResultArea") ||
		document.querySelector("#availabilityResultForm") ||
		document.body;

	const observer = new MutationObserver((mutations) => {
		let shouldRecalc = false;

		for (const m of mutations) {
			if (m.addedNodes && m.addedNodes.length > 0) {
				shouldRecalc = true;
				break;
			}
		}

		if (!shouldRecalc) return;

		if (ppRecalcTimer) {
			clearTimeout(ppRecalcTimer);
		}
		ppRecalcTimer = setTimeout(() => {
			injectMilesAndPointsIntoPrice();
			createPpReferenceTable();
			createNewFareInlinePpControls();
		}, 500);
	});

	observer.observe(target, { childList: true, subtree: true });
}

function createPpReferenceTable() {
	if (isNewFareSystemContext()) {
		const existingNew = document.getElementById("ana-pp-helper-ref");
		if (existingNew) existingNew.remove();
		return;
	}

	const existing = document.getElementById("ana-pp-helper-ref");
	const previousCollapsed =
		existing && existing.dataset && existing.dataset.collapsed === "true";

	const firstSpan = document.querySelector("span.hoverInfo");
	if (!firstSpan) {
		if (existing) existing.remove();
		return;
	}

	const baseMiles = getBaseMilesFromFlex(firstSpan);
	if (!baseMiles) {
		if (existing) existing.remove();
		return;
	}

	let container = existing;
	if (!container) {
		container = document.createElement("div");
		container.id = "ana-pp-helper-ref";
		container.style.position = "fixed";
		container.style.right = "16px";
		container.style.bottom = "16px";
		container.style.zIndex = "9999";
		container.style.backgroundColor = "rgba(255,255,255,0.95)";
		container.style.border = "1px solid #ccc";
		container.style.borderRadius = "4px";
		container.style.padding = "8px 10px";
		container.style.fontSize = "11px";
		container.style.maxWidth = "260px";
		container.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
		document.body.appendChild(container);
	}

	const defs = getDomesticFareDefinitions();
	const routeMultiplier = 2;

	const collapsed = previousCollapsed;

	let html =
		'<div id="ana-pp-helper-ref-header" style="font-weight:bold;margin-bottom:4px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">';
	html += `<span>PP早見表 (base ${baseMiles.toLocaleString()}mile)</span>`;
	html += `<span style="font-size:12px;">${collapsed ? "＋" : "－"}</span>`;
	html += "</div>";

	html += `<div id="ana-pp-helper-ref-body" style="${
		collapsed ? "display:none;" : ""
	}">`;
	html += '<table style="border-collapse:collapse;width:100%;">';
	html +=
		'<thead><tr><th style="border-bottom:1px solid #ccc;text-align:left;">種別</th><th style="border-bottom:1px solid #ccc;text-align:right;">PP</th></tr></thead><tbody>';

	defs.forEach((def) => {
		const pp = Math.floor(
			baseMiles * def.rate * routeMultiplier + def.boarding
		);
		if (!Number.isFinite(pp)) return;
		const code = def.code || (def.type != null ? `F${def.type}` : "");
		html += `<tr><td>${code} ${
			def.label
		}</td><td style="text-align:right;">${pp.toLocaleString()}PP</td></tr>`;
	});

	html += "</tbody></table></div>";
	container.innerHTML = html;

	container.dataset.collapsed = collapsed ? "true" : "false";

	const header = document.getElementById("ana-pp-helper-ref-header");
	const body = document.getElementById("ana-pp-helper-ref-body");

	if (header && body) {
		header.addEventListener("click", () => {
			const isCollapsed = container.dataset.collapsed === "true";
			const nextCollapsed = !isCollapsed;
			container.dataset.collapsed = nextCollapsed ? "true" : "false";
			body.style.display = nextCollapsed ? "none" : "";

			const iconSpan = header.querySelector("span:last-child");
			if (iconSpan) {
				iconSpan.textContent = nextCollapsed ? "＋" : "－";
			}
		});
	}
}

function createNewFareInlinePpControls() {
	if (!isNewFareSystemContext()) return;
	if (document.getElementById("ana-pp-helper-inline-ctrl")) return;

	const body = document.querySelector(".p-vacant-seat01__body");
	if (!body) return;

	const wrapper = document.createElement("div");
	wrapper.id = "ana-pp-helper-inline-ctrl";
	wrapper.style.margin = "8px 0";
	wrapper.style.fontSize = "12px";
	wrapper.style.display = "flex";
	wrapper.style.alignItems = "center";
	wrapper.style.gap = "4px";

	wrapper.innerHTML =
		'<span style="font-weight:bold;">PP計算:</span>' +
		"<span>区間基本マイル</span>" +
		'<input id="ana-pp-helper-inline-base" type="number" min="0" step="1" style="width:80px;padding:2px 4px;font-size:12px;" placeholder="例: 984">' +
		'<button id="ana-pp-helper-inline-btn" type="button" style="padding:2px 8px;font-size:12px;">適用</button>' +
		'<button id="ana-pp-helper-inline-reset" type="button" style="padding:2px 8px;font-size:12px;margin-left:4px;">リセット</button><br>' +
		'<span style="margin-left:16px;">乗継1回 bm1</span>' +
		'<input id="ana-pp-helper-inline-base1" type="number" min="0" step="1" style="width:70px;padding:2px 4px;font-size:12px;margin-left:4px;" placeholder="例: 984">' +
		"<span>bm2</span>" +
		'<input id="ana-pp-helper-inline-base2" type="number" min="0" step="1" style="width:70px;padding:2px 4px;font-size:12px;margin-left:4px;" placeholder="例: 984">' +
		'<button id="ana-pp-helper-inline-btn-transfer" type="button" style="padding:2px 8px;font-size:12px;margin-left:4px;">乗継適用</button>' +
		'<button id="ana-pp-helper-link-sim" type="button" style="padding:2px 8px;font-size:12px;margin-left:8px;">PPシミュレーター</button>' +
		'<button id="ana-pp-helper-link-chart" type="button" style="padding:2px 8px;font-size:12px;">区間マイル表</button>';

	body.insertBefore(wrapper, body.firstChild);

	const input = document.getElementById("ana-pp-helper-inline-base");
	const inputLeg1 = document.getElementById("ana-pp-helper-inline-base1");
	const inputLeg2 = document.getElementById("ana-pp-helper-inline-base2");
	const btn = document.getElementById("ana-pp-helper-inline-btn");
	const resetBtn = document.getElementById("ana-pp-helper-inline-reset");
	const transferBtn = document.getElementById(
		"ana-pp-helper-inline-btn-transfer"
	);
	const simBtn = document.getElementById("ana-pp-helper-link-sim");
	const chartBtn = document.getElementById("ana-pp-helper-link-chart");

	if (btn && input) {
		btn.addEventListener("click", () => {
			const value = parseInt(input.value, 10);
			if (Number.isNaN(value) || value <= 0) {
				return;
			}
			baseMilesDirect = value;
			manualBaseMiles = value;
			annotateNewFarePrices();
		});
	}

	if (resetBtn && input) {
		resetBtn.addEventListener("click", () => {
			manualBaseMiles = null;
			baseMilesDirect = null;
			baseMilesLeg1 = null;
			baseMilesLeg2 = null;
			input.value = "";
			if (inputLeg1) inputLeg1.value = "";
			if (inputLeg2) inputLeg2.value = "";

			const priceEmElements = document.querySelectorAll(
				".p-vacant-seat01__cell .p-vacant-seat01__btn-price em"
			);
			priceEmElements.forEach((em) => {
				const original = em.dataset.anaPpOriginalHtml;
				if (original != null) {
					em.innerHTML = original;
				}
				const cell = em.closest(".p-vacant-seat01__cell");
				if (cell) {
					cell.style.backgroundColor = "";
				}
			});
		});
	}

	if (transferBtn && inputLeg1 && inputLeg2) {
		transferBtn.addEventListener("click", () => {
			const v1 = parseInt(inputLeg1.value, 10);
			const v2 = parseInt(inputLeg2.value, 10);
			if (Number.isNaN(v1) || v1 <= 0 || Number.isNaN(v2) || v2 <= 0) {
				return;
			}
			baseMilesLeg1 = v1;
			baseMilesLeg2 = v2;
			annotateNewFarePrices();
		});
	}

	if (simBtn) {
		simBtn.addEventListener("click", () => {
			window.open(
				"https://cam.ana.co.jp/amcmember/SimulationJaSwitching",
				"_blank",
				"noopener"
			);
		});
	}

	if (chartBtn) {
		chartBtn.addEventListener("click", () => {
			window.open(
				"https://www.ana.co.jp/ja/jp/amc/flightmile/dom/chart/",
				"_blank",
				"noopener"
			);
		});
	}
}
// content script logic has been split into:
// - context.js
// - fareRules.js
// - legacyPage.js
// - newPage.js
// - init.js
// See those files for implementation.
