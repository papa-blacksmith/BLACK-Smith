BLACK Smith Phase 3-1 Module Fix

不具合:
OrbitControls内部の bare import "three" をブラウザが解決できず、
main.js全体が起動前に停止していました。

修正:
- Three.js本体をesm.shへ変更
- OrbitControlsもesm.shへ変更
- OrbitControls内部の依存関係を自動解決
- タイトル画面から鍛冶場へ進めない問題を修正
- 3D回転・ズーム・移動を維持

修正前:
cdn.jsdelivr.net のOrbitControlsが内部で "three" を読み込む

修正後:
esm.shが依存関係を完全なURLへ変換して配信
