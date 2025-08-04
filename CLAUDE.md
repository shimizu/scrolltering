# CLAUDE.md

このファイルは、このリポジトリのコードを扱う際に Claude Code (claude.ai/code) に対してガイダンスを提供します。

## プロジェクト概要

これは Simple Scrolly Triggering System (`scrolltering`) のデモンストレーションです - スクロールトリガーイベントに IntersectionObserver を使用する JavaScript ライブラリです。このプロジェクトはモダンな JavaScript 開発に Rollup を使用し、包括的な HTML デモを含んでいます。

## 共通開発コマンド

このプロジェクトはモダンな JavaScript 開発に Rollup を使用します：

### セットアップ
```bash
npm install                    # 依存関係のインストール
```

### 開発
```bash
npm run serve                  # 開発サーバー起動（http://localhost:3000、ライブリロード付き）
npm run dev                    # ファイル変更監視ビルド
npm run build                  # 本番用ビルド
npm run preview               # ビルド結果のプレビュー（http://localhost:3001）
```

## 主要ファイル

- `src/scrolltering.js` - ScrollySystem クラスのコア実装
- `src/index.js` - モジュールエクスポートのエントリーポイント
- `public/index.html` - ビジュアル例とデバッグパネル付きの基本インタラクティブデモ
- `public/complexity.html` - 複数の ScrollySystem インスタンスを持つ高度なデモ
- `README.md` - 日本語での包括的なドキュメント
- `README.dev.md` - 開発環境セットアップガイド
- `rollup.config.js` - Rollup ビルド設定

## コアアーキテクチャ

### ScrollySystem クラス
`scrolltering.js:5-171` にあるメインクラスは以下を提供します：
- IntersectionObserver ベースのスクロール追跡
- パフォーマンス向上のためのデバウンスイベント処理
- 適切なクリーンアップによるメモリリーク防止
- コールバック API とイベント API の両方をサポート
- 動的要素の追加/削除
- ユニーク ID による複数インスタンスサポート

### 主要メソッド
- `constructor(options)` - 設定可能なオプションで初期化
- `observe(element)` - 追跡対象に要素を追加
- `unobserve(element)` - 追跡対象から要素を削除
- `getCurrentTriggerId()` - 現在アクティブなトリガー ID を取得
- `destroy()` - リソースのクリーンアップ

### 設定オプション
- `selector` - 追跡対象要素の CSS セレクタ（デフォルト: '[data-trigger]'）
- `triggerAttribute` - トリガー ID を含む属性（デフォルト: 'data-trigger'）
- `threshold` - インtersection のしきい値（デフォルト: 0）
- `rootMargin` - intersection のルートマージン（デフォルト: '0px'）
- `debounceDelay` - デバウンス遅延（ミリ秒、デフォルト: 10）
- `onChange` - トリガー変更時のコールバック関数

## 開発ワークフロー

### ローカル開発
1. `npm install` を実行して依存関係をインストール
2. `npm run serve` を実行してライブリロード付き開発サーバーを起動
3. http://localhost:3000 を開いて基本デモを表示
4. complexity.html に移動して高度なデモを表示
5. `src/` ディレクトリのファイルを編集 - 変更は自動リロード

### 本番ビルド
1. `npm run build` を実行して最適化されたビルドを作成
2. ファイルは `dist/` ディレクトリに出力されます：
   - `scrolltering.js` - ブラウザ用 UMD ビルド
   - `scrolltering.es.js` - モダンバンドラー用 ES モジュールビルド

### 統合オプション
1. **NPM モジュール** - `dist/` からビルドファイルを使用
2. **直接インクルード** - `dist/scrolltering.js` をプロジェクトにコピー
3. **ES モジュール** - `dist/scrolltering.es.js` からインポート
4. **ソース統合** - `src/scrolltering.js` をコピーして修正

## 使用パターン

### 基本的な使用法
```javascript
const scrolly = new ScrollySystem();
window.addEventListener('scrollTrigger', (event) => {
    console.log('Current section:', event.detail.current);
});
```

### コールバックベースの使用法（推奨）
```javascript
const scrolly = new ScrollySystem({
    onChange: ({ current, previous }) => {
        console.log(`Changed from ${previous} to ${current}`);
    }
});
```

## ブラウザ互換性

- Chrome 51+
- Firefox 55+  
- Safari 12.1+
- Edge 15+
- IE11（IntersectionObserver ポリフィル必要）

## パフォーマンス上の考慮事項

- 効率的なスクロール追跡に IntersectionObserver を使用
- デバウンス更新により過度なイベント発火を防止
- 適切なクリーンアップによりメモリリークを防止
- キャッシュによる最小限の DOM クエリ