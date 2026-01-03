// Mapping from Japanese airport/city name to IATA airport code.
// Generated from misc/日本 空港・都市コード一覧 _ トラベルアンサー.html

const airportNameToCode = {
	旭川: "AKJ",
	函館: "HKD",
	釧路: "KUH",
	女満別: "MMB",
	帯広: "OBO",
	奥尻: "OIR",
	丘珠: "OKD",
	札幌千歳: "CTS",
	青森: "AOJ",
	秋田: "AXT",
	福島: "FKS",
	山形: "GAJ",
	花巻: "HNA",
	三沢: "MSJ",
	仙台: "SDJ",
	新潟: "KIJ",
	松本: "MMJ",
	東京成田: "NRT",
	東京羽田: "HND",
	名古屋中部: "NGO",
	小松金沢: "KMQ",
	大阪関西: "KIX",
	大阪伊丹: "ITM",
	南紀白浜: "SHM",
	但馬: "TJH",
	神戸: "UKB",
	広島: "HIJ",
	出雲: "IZO",
	隠岐: "OKI",
	岡山: "OKJ",
	山口宇部: "UBJ",
	高知: "KCZ",
	松山: "MYJ",
	高松: "TAK",
	徳島: "TKS",
	福岡: "FUK",
	北九州: "KKJ",
	宮崎: "KMI",
	熊本: "KMJ",
	鹿児島: "KOJ",
	長崎: "NGS",
	大分: "OIT",
	奄美大島: "ASJ",
	喜界島: "KKX",
	屋久島: "KUM",
	沖永良部: "OKE",
	与論: "RNJ",
	徳之島: "TKN",
	種子島: "TNE",
	粟国: "AGJ",
	波照間: "HTR",
	石垣: "ISG",
	北大東: "KTD",
	南大東: "MMD",
	宮古: "MMY",
	与那国: "OGN",
	沖縄: "OKA",
	多良間: "TRA",
	久米島: "UEO",
};

function normalizeAirportDisplayName(name) {
	if (!name) return "";
	let n = String(name).trim();
	n = n.replace(/^東京[（(]羽田[）)]$/, "東京羽田");
	n = n.replace(/^東京[（(]成田[）)]$/, "東京成田");
	n = n.replace(/^札幌[（(]新千歳[）)]$/, "札幌千歳");
	n = n.replace(/^沖縄[（(]那覇[）)]$/, "沖縄");
	return n;
}

function airportNameToIataCode(displayName) {
	const key = normalizeAirportDisplayName(displayName);
	return airportNameToCode[key] || null;
}
