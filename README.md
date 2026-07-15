# BLACK Smith

GitHub Pagesで動作するBLACK Smith Ver0.6-dev.1です。

## 差し替え方法

1. このZIPを解凍します。
2. GitHub Desktopの `BLACK-Smith` フォルダを開きます。
3. 解凍したフォルダ内のファイルとフォルダをすべてコピーします。
4. `BLACK-Smith` フォルダへ貼り付け、既存ファイルを上書きします。
5. GitHub Desktopで `Replace with repository version` と入力します。
6. `Commit to main` → `Push origin` を押します。
7. 1〜3分後に公開ページを `Ctrl + Shift + R` で更新します。

## 構成

- `index.html`
- `css/style.css`
- `js/main.js`
- `js/systems.js`
- `data/*.json`
- `docs/`
- `ue5/`

## 実装済み

- 自由鍛造
- 自由設計図
- 9武器種
- 6段階鍛造
- レアリティ
- スキル
- 呪い・超越
- 午前5時更新
- 5段階探索
- 14本保管
- 特殊背景図鑑

## Ver0.6 開発開始：共通造形データ

自由鍛造と設計図制作は、同じ `WeaponShape` JSONを共有します。

- 自由鍛造の形を設計図として保存
- 設計図から同じ形を復元
- 完成武器にも形状データとフィンガープリントを保存
- 将来のThree.js / Unreal Engine 5移植に利用可能
