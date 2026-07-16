BLACK Smith Ver0.9 Weapon Assembly Engine

実装:
- CAD Mesh Engineで全表示パーツを同時3D化
- Blade / Guard / Grip / Pommelを独立Meshとして生成
- ROOT基準で武器全体を組立
- パーツごとの位置、回転、横スケール、縦スケールを反映
- パーツ表示ON/OFFを3Dへ反映
- 2Dパーツ変更時に武器全体を再構築
- 刀身はCADポリゴン三角形分割
- 鍔は立体Boxメッシュ
- 柄はCylinderメッシュ
- ポンメルはSphereメッシュ
- 金属名と色・発光設定を3Dマテリアルへ反映
- 一部パーツ生成失敗時は前回の正常な武器全体を維持

現在:
- 接続先データは保存・読込済み
- 自動ソケット追従は次段階
- ハンマー頭、槍先、斧頭の専用形状は次段階
