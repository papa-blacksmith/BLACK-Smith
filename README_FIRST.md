# BLACK Smith UE5 Edition Ver0.20

UE5.6向けC++プロジェクト基盤です。

## 含まれるもの
- C++プロジェクト構成
- 三人称キャラクター移動基盤
- Enhanced Input受け口
- インタラクトInterface
- 20秒Opening Director
- Niagara接続口
- Lumen / Nanite / Virtual Shadow Maps設定
- Steam Online Subsystem設定
- PythonによるMap/Sequence作成
- 工房ブロックアウト生成
- Windowsビルドスクリプト

## 初回手順
1. UE5.6とVisual Studio 2022をインストール
2. 環境変数 `UE_ENGINE_DIR` を設定
3. `Scripts/GenerateProjectFiles.bat`
4. `Scripts/BuildEditor.bat`
5. `BLACKSmith.uproject` を開く
6. `Content/Python/setup_blacksmith_project.py` を実行
7. `Content/Python/build_workshop_blockout.py` を実行

## Unreal Editorで生成する必要があるもの
`.uasset`はUnreal Editor専用バイナリです。WBP_Title、Enhanced Input Assets、Niagara Systems、カメラカット、最終工房アセットはエディタ上で作成してください。

## Steam
開発中はテスト用App ID 480です。公開前に正式App IDへ変更してください。
