# Rollup 開発環境セットアップガイド

## 前提条件

- Node.js 16以上
- npm または yarn

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発コマンド

```bash
# 開発サーバーを起動（ライブリロード付き）
npm run serve

# ファイル変更を監視してビルド
npm run dev

# 本番用ビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

## プロジェクト構造

```
scrolltering/
├── src/                     # ソースコード
│   ├── index.js            # エントリーポイント
│   └── scrolltering.js     # ScrollySystemクラス
├── public/                  # 静的ファイル
│   ├── index.html          # 基本デモ
│   └── complexity.html     # 高度なデモ
├── dist/                    # ビルド出力（自動生成）
│   ├── scrolltering.js     # UMDビルド
│   └── scrolltering.es.js  # ESモジュールビルド
├── rollup.config.js         # Rollup設定
└── package.json
```

## 開発ワークフロー

1. `npm run serve` で開発サーバーを起動
2. ブラウザで http://localhost:3000 にアクセス
3. src/ 内のファイルを編集すると自動的にリロード
4. 本番リリース前に `npm run build` でビルドを確認

## ビルド出力

- `dist/scrolltering.js` - ブラウザ用UMDビルド
- `dist/scrolltering.es.js` - モダンブラウザ用ESモジュール

## トラブルシューティング

### ポート3000が使用中の場合
rollup.config.jsのport番号を変更してください。

### ライブリロードが機能しない場合
ブラウザのキャッシュをクリアしてください。