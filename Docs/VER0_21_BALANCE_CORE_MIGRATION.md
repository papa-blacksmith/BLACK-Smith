# BLACK Smith UE5 Ver0.21 Balance Core Migration

## 移植済み

- Combat Engine
- Shape Analyzer
- Material Calculator
- PvP Simulator
- PvE Simulator
- Economy Simulator
- AI Balance Engine
- Developer Dashboard用GameInstanceSubsystem
- CSVエクスポート
- ブラウザ武器JSONインポート

## C++クラス

- UBSShapeAnalyzer
- UBSMaterialCalculator
- UBSCombatEngine
- UBSPvPSimulator
- UBSPvESimulator
- UBSEconomySimulator
- UBSBalanceAI
- UBSBalanceDashboardSubsystem
- UBSBrowserWeaponImporter

## 最大シミュレーション数

PvP / PvEともに1回の呼び出しで最大1,000,000回です。

大量実行は同期処理のため、実製品ではTask GraphまたはAsyncへ移す予定です。
Developer Dashboardからは1,000 / 10,000 / 100,000を段階実行してください。

## ブラウザ版との接続

Browser Prototypeから次の形式のJSONを渡します。

```json
{
  "name": "武器名",
  "shape": {
    "lengthCm": 90,
    "averageWidthCm": 5,
    "thicknessCm": 0.8,
    "curvature": 0.2,
    "serration": 0.1,
    "holeRatio": 0
  },
  "forgeOres": [
    { "id": "BMC-R001", "name": "アズライト" }
  ]
}
```

## Blueprintでの利用順

1. Browser Weapon Importer
2. Shape Analyzer
3. Material Calculator
4. Combat Stats生成
5. PvP/PvE Simulator
6. Balance AI
7. Dashboard Subsystemへ記録
8. CSV出力

## 次段階

- Async Simulator
- UMG Developer Dashboard
- DataTableによる183鉱物定義
- 武器種間ヒートマップ
- スキル帯別AI
- Dedicated Serverでのサーバー権威戦闘
