# WeaponShape Schema v1

```json
{
  "version": 1,
  "weaponType": 0,
  "length": 60,
  "width": 45,
  "thickness": 35,
  "curve": 25,
  "twist": 0,
  "tip": 50,
  "notch": 0,
  "ornament": 20,
  "material": "黒鉄",
  "color": "#d9dce4",
  "points": [
    {"x": 0.08, "y": 0.56},
    {"x": 0.30, "y": 0.47},
    {"x": 0.62, "y": 0.42},
    {"x": 0.90, "y": 0.50}
  ]
}
```

Web版、Three.js版、Unreal Engine 5版で共有する基本形式です。

## 制御点編集

`points` は0〜1で正規化された座標です。WebのSVG表示、Three.jsメッシュ生成、UE5 Procedural Mesh生成で共通利用します。

- 最低2点
- 最大12点
- x座標順に正規化
- Pointer EventsでPC・スマホ両対応


## Schema v2 — Bézier handles

各制御点はアンカー座標に加え、相対座標の入出力ハンドルを持ちます。

```json
{
  "x": 0.30,
  "y": 0.47,
  "inX": -0.08,
  "inY": 0.03,
  "outX": 0.09,
  "outY": -0.03,
  "smooth": true
}
```

- `inX`, `inY`: 前の区間から入るハンドル
- `outX`, `outY`: 次の区間へ出るハンドル
- `smooth: true`: 反対側のハンドルを同一直線上に保つ
- `smooth: false`: 左右ハンドルを独立させ、角や折れを作る
