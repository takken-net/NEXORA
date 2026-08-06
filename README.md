# 今の気持ちを、映画に映す by NEXORA

気持ち・色・観たい気分・観る時間からTMDb/iTunesと連携して映画をおすすめするWebアプリです。

## 公開手順(GitHub Pages)

1. GitHubで新しい**公開(Public)**リポジトリ を作成する(例: `kimochi-movie`)。
   ※GitHubの無料プランでは、Pagesは公開リポジトリのみで使えます。

2. このフォルダの中身(`index.html`、`.github`フォルダ、`scripts`フォルダ)をリポジトリのルートにそのままアップロードする。
   - GitHubのリポジトリ画面 →「Add file」→「Upload files」→ このフォルダの中身をまとめてドラッグ&ドロップ
   - `.github/workflows/update-fallback-movies.yml` のようなフォルダ構造もそのまま保持されます

3. TMDbのAPIキーをリポジトリのシークレットに登録する(自動更新の仕組みで使用)。
   - リポジトリの「Settings」→「Secrets and variables」→「Actions」→「New repository secret」
   - Name: `TMDB_API_KEY`
   - Secret: お手持ちのTMDb APIキー(v3 auth)

4. GitHub Pagesを有効化する。
   - 「Settings」→「Pages」
   - 「Source」を「Deploy from a branch」にし、Branchで `main` / `/(root)` を選んで保存

5. 数分待つと、`https://(あなたのユーザー名).github.io/(リポジトリ名)/` でアプリが公開されます。

6. 初回のフォールバックリスト自動更新を今すぐ実行したい場合は、
   「Actions」タブ →「Update fallback movies」→「Run workflow」で手動実行できます。
   (放っておいても毎週月曜4時頃(日本時間)に自動実行されます)

## 注意点

- `index.html` にはTMDbのAPIキーがそのまま埋め込まれています。TMDbのv3 APIキーはクライアント側での利用を前提とした仕様のため問題ありませんが、公開リポジトリなので誰でもソースを閲覧できる状態になります。
- `fallback-movies.json` は初回は存在しません。GitHub Actionsが初めて実行されたときに自動生成され、以降は週次で更新されます。それまでの間は、アプリに組み込み済みの厳選48本リストがフォールバックとして使われるので、動作に支障はありません。
