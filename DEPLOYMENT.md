# Deployment Guide - Remimazolam PK/PD Simulator

## GitHub Pages デプロイメント手順

### 1. GitHubリポジトリの作成

1. GitHub.comにログインして新しいリポジトリを作成
2. リポジトリ名: `remimazolam-simulator` （または任意の名前）
3. **Public** リポジトリとして作成（GitHub Pages は無料プランでは public のみ）
4. READMEの初期化はチェックしない

### 2. ローカルファイルのアップロード

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/remimazolam-simulator.git
cd remimazolam-simulator

# プロジェクトファイルをコピー
cp -r /Users/ysuzuki/Dropbox/claude_work/remimazolam_java/* .

# Gitに追加
git add .
git commit -m "Initial commit: Remimazolam PK/PD Simulator web app"
git push origin main
```

### 3. GitHub Pages の設定

1. GitHubリポジトリページで **Settings** タブをクリック
2. 左サイドバーで **Pages** をクリック
3. **Source** セクションで "Deploy from a branch" を選択
4. **Branch** で "main" を選択
5. **Folder** で "/ (root)" を選択
6. **Save** をクリック

### 4. デプロイメント完了

- 数分後に `https://yourusername.github.io/remimazolam-simulator/` でアクセス可能
- デプロイ状況は **Actions** タブで確認可能

## カスタムドメインの設定（オプション）

### 1. ドメイン設定ファイルの作成

```bash
echo "yourdomain.com" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push origin main
```

### 2. DNS設定

A レコードまたは CNAME レコードを設定:

```
# A レコードの場合
yourdomain.com. A 185.199.108.153
yourdomain.com. A 185.199.109.153
yourdomain.com. A 185.199.110.153
yourdomain.com. A 185.199.111.153

# CNAME レコードの場合（サブドメイン）
www.yourdomain.com. CNAME yourusername.github.io.
```

## 他のホスティングサービス

### Netlify

1. [Netlify](https://netlify.com) にサインアップ
2. "New site from Git" を選択
3. GitHubリポジトリを連携
4. Build settings:
   - Build command: （空白）
   - Publish directory: `/`
5. Deploy site をクリック

### Vercel

1. [Vercel](https://vercel.com) にサインアップ
2. "New Project" を選択
3. GitHubリポジトリをインポート
4. Framework Preset: "Other"
5. Root Directory: `./`
6. Deploy をクリック

### Firebase Hosting

```bash
# Firebase CLI をインストール
npm install -g firebase-tools

# プロジェクトを初期化
firebase init hosting

# デプロイ
firebase deploy
```

## ローカル開発サーバー

### Python 3 を使用

```bash
cd /Users/ysuzuki/Dropbox/claude_work/remimazolam_java
python -m http.server 8000
# http://localhost:8000 でアクセス
```

### Node.js を使用

```bash
# http-server をインストール
npm install -g http-server

# サーバー起動
cd /Users/ysuzuki/Dropbox/claude_work/remimazolam_java
http-server -p 8000
```

### PHP を使用

```bash
cd /Users/ysuzuki/Dropbox/claude_work/remimazolam_java
php -S localhost:8000
```

## プロダクション最適化（オプション）

### 1. ファイル圧縮

```bash
# Gzip圧縮（サーバー設定）
# .htaccess ファイル作成
echo '<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>' > .htaccess
```

### 2. キャッシュ設定

```bash
# .htaccess でキャッシュ制御
echo '<IfModule mod_expires.c>
  ExpiresActive on
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/html "access plus 1 hour"
</IfModule>' >> .htaccess
```

### 3. JavaScript/CSS 最小化

```bash
# UglifyJS をインストール
npm install -g uglify-js

# JavaScript を最小化
uglifyjs js/models.js js/calculator.js js/main.js -c -m -o js/app.min.js
```

## セキュリティ設定

### Content Security Policy

```html
<!-- index.html の head に追加 -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
```

## モニタリング

### Google Analytics（オプション）

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 注意事項

1. **医療免責事項**: 必ず免責事項を表示し、教育・研究用途のみであることを明示
2. **プライバシー**: データはローカル処理のみで外部送信しない
3. **アクセシビリティ**: WCAG 2.1 AA 準拠を推奨
4. **ブラウザ対応**: モダンブラウザ（Chrome, Firefox, Safari, Edge）対応
5. **レスポンシブ**: モバイル・タブレット・デスクトップ対応済み