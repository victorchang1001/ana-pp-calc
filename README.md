## ANA PP Helper

Chrome extension that helps estimate Premium Points (PP) and yen per PP (円/PP) for ANA domestic fares.

It runs on ANA’s domestic flight availability / booking pages on:

- `https://aswbe-d.ana.co.jp/*`
- `https://aswbe.ana.co.jp/*`

and augments each fare with PP information.

### What it does (EN)

- Detects ANA domestic flight search / booking result pages.
- Reads fare information and:
  - Estimates Premium Points (PP) per fare.
  - Calculates yen per PP (円/PP) from the displayed price.
  - Highlights especially good value fares (for example, `< 10 円/PP`) by coloring the cell.
- Supports both:
  - Legacy domestic fare system (F1–F8 style categories).
  - New domestic fare system (A–P) starting around 2026-05-19, including:
    - Reading visually hidden fare descriptions.
    - Applying the correct PP accrual rate and boarding points per fare type.
- On the new-style fare table, adds a small inline control block:
  - `PP計算` inputs for:
    - Direct flight base miles.
    - One-stop itineraries (bm1 / bm2 for each leg).
  - Buttons:
    - `適用`: apply direct base miles to all fares.
    - `乗継適用`: apply bm1 / bm2 for connecting itineraries.
    - `リセット`: restore original prices and clear highlights.
    - `PPシミュレーター`: open the official ANA PP simulator.
    - `区間マイル表`: open the official ANA section mileage chart.
- Adds a small reference panel showing fare categories, accrual rates, and boarding points when available.

### How to load in Chrome

1. Open `chrome://extensions` in Chrome.
2. Enable "Developer mode" in the top-right.
3. Click "Load unpacked".
4. Select this folder (the one containing `manifest.json`).

### How to use

- After loading the extension:
  - Open an ANA domestic flight search / booking page (above domains).
  - Run a search so that the fare table appears.
  - The extension will automatically:
    - Add PP and 円/PP below each price where it can be calculated.
    - Highlight cells with particularly low 円/PP.
    - For the new fare layout, show the `PP計算` controls above the table so you can enter base miles and recalculate PP.
- All calculations are best-effort estimates. Always confirm with the official ANA information.

### Permissions / Privacy

- Uses `tabs` permission only to detect the current URL and enable/disable the extension.
- Runs content scripts only on `aswbe-d.ana.co.jp` and `aswbe.ana.co.jp`.
- Does not send data to any external server; all calculations run locally in your browser.

---

## ANA PP Helper（日本語）

ANA国内線運賃のプレミアムポイント（PP）と、1PPあたりの金額（円/PP）を一覧画面で分かりやすく表示する Chrome 拡張機能です。

対象となるページ：

- `https://aswbe-d.ana.co.jp/*`
- `https://aswbe.ana.co.jp/*`

の国内線空席照会・予約画面で動作します。

### 機能概要

- ANA 国内線の空席照会・予約結果画面を自動で検出。
- 各運賃について以下を表示します：
  - プレミアムポイント（PP）の概算値。
  - 表示運賃から計算した 1PP あたりの金額（円/PP）。
  - 円/PP が一定値（例：10円未満）より良い場合は、セルの背景色を変更してハイライト。
- 対応している運賃体系：
  - 従来の国内線運賃区分（F1〜F8 など）。
  - 2026-05-19 頃からの新運賃体系（A〜P）：
    - 「クラス…、運賃…」といった視覚的に非表示の情報から運賃種別を判定。
    - 運賃種別ごとの加算率・搭乗ポイントを用いて PP を計算。
- 新しい空席表示画面では、運賃表の上部に `PP計算` のインライン入力欄を追加：
  - 直行便用：区間基本マイルを入力し `適用` ボタンで全運賃に反映。
  - 乗継1回用：bm1 / bm2（各区間の基本マイル）を入力し `乗継適用` で反映。
  - `リセット` ボタンで元の表示と背景色に戻すことが可能。
  - ショートカットボタン：
    - `PPシミュレーター`: 公式の ANA PP シミュレーターを新しいタブで開く。
    - `区間マイル表`: 公式の区間基本マイル表を新しいタブで開く。
- 場合によっては、運賃区分ごとの加算率・搭乗ポイントを一覧にした簡易リファレンス表も表示します。

### インストール方法（Chrome）

1. Chrome で `chrome://extensions` を開く。
2. 右上で「デベロッパーモード」をオンにする。
3. 「パッケージ化されていない拡張機能を読み込む」をクリック。
4. このリポジトリのフォルダ（`manifest.json` があるフォルダ）を選択。

### 使い方

- 上記の手順で拡張機能を読み込んだあと：
  - ANA 国内線の空席照会または予約画面を開く。
  - 検索を実行し、運賃一覧が表示されるまで待つ。
  - 対応している画面であれば、自動的に各運賃に PP と 円/PP が付加され、条件に応じてセルがハイライトされます。
  - 新運賃レイアウトの画面では、運賃表の上部に `PP計算` の入力欄が表示され、区間基本マイルを入力して再計算できます。

※ 本拡張機能で表示される PP および 円/PP はあくまで目安の計算値です。正式な積算数・条件については、必ず ANA 公式サイトの情報をご確認ください。

### 権限・プライバシー

- 使用している権限は `tabs` と、ANA サイトでのコンテンツスクリプト実行のみです。
- コンテンツスクリプトは `aswbe-d.ana.co.jp` および `aswbe.ana.co.jp` でのみ動作します。
- 外部サーバーへの送信は行わず、計算はすべてブラウザ内で完結します。
