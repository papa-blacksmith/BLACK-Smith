BLACK Smith Ver0.3.3 修正版

原因
タイトル画面の .title に display:flex が直接指定されており、
画面移動後もタイトル画面だけが消えずに残っていました。

修正内容
- タイトル画面は active の時だけ display:flex
- ホーム、ガチャ、鍛冶、武器庫の切り替えを正常化

更新手順
1. index.htmlをBLACK-Smithフォルダへ上書き
2. GitHub Desktopで Update to Ver0.3.3 Fix と入力
3. Commit to main
4. Push origin
5. 1〜3分後に公開ページをCtrl+Shift+R
