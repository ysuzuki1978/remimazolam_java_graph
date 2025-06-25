# Remimazolam PK/PD Simulator with Graph - Web Version

レミマゾラムの薬物動態・薬力学シミュレーター（グラフ機能付きWeb版）

## 概要

このWebアプリケーションは、鎮静薬レミマゾラムの薬物動態・薬力学をシミュレートする教育・研究用ツールです。iOS版から移植されており、Masui 2022モデルに基づく高精度な計算エンジンを搭載しています。

## 特徴

- **高精度計算**: V3ハイブリッド + LSODA エンジンによる0.01分間隔の計算
- **LSODA積分法**: 剛性・非剛性を自動判定する最適化されたODE解法
- **3コンパートメントモデル**: Masui 2022 人口薬物動態モデル
- **効果部位濃度**: Masui & Hagihira 2022 ke0モデル
- **複数投与対応**: ボーラス投与と持続投与の組み合わせ
- **グラフ表示**: Chart.jsによる血漿濃度と効果部位濃度の時系列グラフ
- **CSV出力**: シミュレーション結果のエクスポート機能
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応

## 技術仕様

### フロントエンド
- **HTML5**: セマンティックマークアップ
- **CSS3**: モダンなレスポンシブデザイン
- **JavaScript (ES6+)**: バニラJSによる実装
- **Chart.js**: インタラクティブなグラフ表示ライブラリ
- **PWA対応**: オフライン利用可能

### 計算エンジン
- **LSODA法**: Livermore Solver for ODEs with Automatic method switching
- **適応的積分**: 剛性問題の自動判定とステップサイズ最適化
- **ハイブリッドアプローチ**: 解析解と数値解の最適な組み合わせ（効果部位濃度）
- **フォールバック機能**: RK4法による後方互換性
- **高精度タイムステップ**: 0.01分間隔での計算

## ファイル構成

```
remimazolam_java/
├── index.html              # メインHTML
├── css/
│   └── style.css           # スタイルシート
├── js/
│   ├── models.js           # データモデル
│   ├── lsoda.js           # LSODA積分法実装
│   ├── calculator.js       # 計算エンジン
│   └── main.js            # メインアプリケーション
├── assets/                 # 静的ファイル
├── test_lsoda.html        # LSODA テストページ
├── manifest.json          # PWA設定
├── sw.js                  # Service Worker
└── README.md              # このファイル
```

## 使用方法

### 1. 患者情報入力
- 年齢（18-100歳）
- 体重（30-200kg）
- 身長（120-220cm）
- 性別（男性/女性）
- ASA-PS（I-II / III-IV）
- 麻酔開始時刻

### 2. 投与スケジュール設定
- 複数の投与イベントを時系列で設定
- ボーラス投与量（0-100mg）
- 持続投与量（0-20mg/kg/hr）
- 投与中止（両方を0に設定）

### 3. シミュレーション実行
- V3ハイブリッドエンジンによる高精度計算
- 血漿濃度と効果部位濃度の同時計算
- リアルタイム結果表示

### 4. 結果表示・出力
- 最大濃度サマリー表示
- 時間経過テーブル
- CSV形式でのエクスポート

## 科学的根拠

本アプリケーションは以下の研究に基づいています：

### 母集団薬物動態モデル
- **Masui, K., et al.** (2022)
- "A population pharmacokinetic model of remimazolam for general anesthesia and consideration of remimazolam dose in clinical practice"
- *Journal of Anesthesia*, 36(4), 493-505
- DOI: 10.1007/s00540-022-03079-y

### 効果部位平衡定数 ke0
- **Masui, K., & Hagihira, S.** (2022)
- "Equilibration rate constant, ke0, to determine effect-site concentration for the Masui remimazolam population pharmacokinetic model in general anesthesia patients"
- *Journal of Anesthesia*, 36(6), 733-742
- DOI: 10.1007/s00540-022-03099-8

## デプロイメント

### GitHub Pages
1. GitHubリポジトリを作成
2. ファイルをアップロード
3. Settings > Pages > Source を "Deploy from a branch" に設定
4. Branch を "main" に設定
5. `https://username.github.io/repository-name/` でアクセス

### ローカル実行
```bash
# HTTPサーバーを起動（Python 3の場合）
python -m http.server 8000

# ブラウザでアクセス
open http://localhost:8000
```

## 免責事項

⚠️ **重要**: このソフトウェアは教育および研究目的でのみ使用してください。

- 本ソフトウェアは医療機器ではありません
- 診断、治療、その他一切の臨床用途・患者ケアに使用してはなりません
- 表示される結果はあくまで理論値であり、実際の臨床的な患者の反応を保証するものではありません
- 本ソフトウェアの使用によって生じたいかなる結果についても、作者は一切の責任を負いません

## ライセンス

MIT License

## 開発者情報

**YASUYUKI SUZUKI**
- ORCID: 0000-0002-4871-9685
- 所属:
  - 済生会松山病院麻酔科
  - 愛媛大学大学院医学系研究科薬理学

**開発環境**: TypeScript/HTML/CSS  
**開発支援**: Developed with Claude Code (Anthropic)

## プライバシー

このソフトウェアは、利用者が入力したいかなるデータも収集、保存、外部送信することはありません。すべての計算は、利用者のブラウザ上で完結します。

## LSODA積分法について

### 概要
LSODA (Livermore Solver for Ordinary Differential Equations with Automatic method switching) は、薬物動態計算において標準的に使用される高精度ODE解法です。

### 技術的利点
1. **剛性問題の自動対応**: 薬物動態の多重時定数（速い分布相・遅い消失相）を自動処理
2. **適応的ステップサイズ**: 計算精度を保ちながら効率を最適化
3. **自動手法切替**: Adams法（非剛性）とBDF法（剛性）を自動選択
4. **高精度**: 医薬品研究における標準的解法

### 実装詳細
- **基本アルゴリズム**: Hindmarsh & Petzold の FORTRAN LSODA を JavaScript に移植
- **誤差制御**: 相対許容誤差 1e-6, 絶対許容誤差 1e-12
- **フォールバック**: LSODA失敗時は自動的にRK4法に切り替え
- **最適化**: 薬物動態特有のパラメータ調整済み

### テスト方法
`test_lsoda.html` でLSODA実装の動作確認が可能：
1. 基本的な指数減衰テスト
2. 3コンパートメントPKモデルテスト  
3. 完全統合テスト
4. 性能測定

## バージョン履歴

- **v1.0**: Web版初回リリース
  - iOS版からの完全移植
  - V3ハイブリッド + LSODA エンジン実装
  - LSODA解法による高精度計算
  - 剛性問題の自動対応
  - 適応的ステップサイズ制御
  - レスポンシブWebデザイン
  - CSV出力機能
  - 包括的テストスイート