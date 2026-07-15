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
