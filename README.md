# シンプルなスクロールトリガリングシステム

## 概要

IntersectionObserverを使用した、汎用的でシンプルなスクロールトリガリングシステムです。特定の要素が画面内に入った時にイベントを発火させる最小限の機能を提供します。

## 使用方法

### 基本的な使い方

```javascript
// インスタンスを作成
const scrolly = new Scrolltering();
```

### コールバックベースの使用

```javascript
const scrolly = new Scrolltering({
    onChange: ({ current, previous }) => {
        console.log(`現在: ${current}, 前回: ${previous}`);
        // ここで任意の処理を実行
    }
});
```

### カスタム設定での使用

```javascript
const scrolly = new Scrolltering({
    selector: '.scroll-item',           // クラスセレクタを使用
    triggerAttribute: 'data-section',   // カスタム属性名
    threshold: 0.5,                     // 要素の50%が見えたら発火
    rootMargin: '-100px 0px',           // 上下100pxのマージン
    debounceDelay: 20,                  // 20msのデバウンス
    onChange: (detail) => {             // コールバック関数
        updateContent(detail.current);
    }
});
```

### HTMLの例

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>スクロールテリング デモ</title>
    <style>
        .scroll-section {
            min-height: 100vh;
            padding: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .scroll-section:nth-child(odd) {
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
    <!-- デフォルトの属性名を使用 -->
    <div class="scroll-section" data-trigger="intro">
        <h1>イントロダクション</h1>
    </div>
    
    <div class="scroll-section" data-trigger="section1">
        <h2>セクション 1</h2>
    </div>
    
    <div class="scroll-section" data-trigger="section2">
        <h2>セクション 2</h2>
    </div>
    
    <div class="scroll-section" data-trigger="conclusion">
        <h2>まとめ</h2>
    </div>
    
    <script src="scrolly-system.js"></script>
    <script>
        // システムを初期化
        const scrolly = new Scrolltering();
        
        // イベントハンドラー
        window.addEventListener('scrollTrigger', (event) => {
            const { current } = event.detail;
            console.log('現在のセクション:', current);
            
            // セクションに応じた処理
            switch(current) {
                case 'intro':
                    // イントロ用の処理
                    break;
                case 'section1':
                    // セクション1用の処理
                    break;
                case 'section2':
                    // セクション2用の処理
                    break;
                case 'conclusion':
                    // まとめ用の処理
                    break;
            }
        });
    </script>
</body>
</html>
```

## HTML構築時の注意点

Scrollteringを正しく動作させるためのHTML構築時の重要なポイントです。

### 要素の高さ設定

各セクション要素には十分な高さを確保する必要があります。

```css
.scroll-section {
    min-height: 100vh; /* ビューポートの高さ以上を推奨 */
    /* または */
    height: 800px; /* 具体的な高さ指定 */
}
```

⚠️ **注意**: 高さが不十分だと、IntersectionObserverが正しく交差を検出できません。

### スクロールコンテナの設定

以下のCSS設定はScrollteringの動作を阻害します：

```css
/* ❌ 避けるべき設定 */
body, html {
    overflow: hidden; /* スクロールを無効にする */
}

.container {
    position: fixed;
    height: 100vh;
    overflow: hidden; /* 子要素のスクロールを無効にする */
}
```

✅ **推奨設定**:
```css
body, html {
    overflow-x: hidden; /* 横スクロールのみ無効（縦スクロールは維持）*/
}
```

### カスタムスクロールコンテナを使用する場合

```javascript
const scrolly = new Scrolltering({
    // rootオプションでスクロール対象コンテナを指定
    root: document.getElementById('scroll-container')
});
```

### 要素の可視性に関する注意

```css
/* ❌ 監視されない要素 */
.hidden-element {
    display: none;     /* 完全に非表示 */
    visibility: hidden; /* レイアウト上は存在するが非表示 */
}

/* ✅ 監視される要素 */
.transparent-element {
    opacity: 0;        /* 透明だが監視対象 */
}
```

### レイアウトに影響するCSS変更

以下のCSSプロパティは、IntersectionObserverの計算に影響を与える可能性があります：

```css
.problematic-styles {
    position: fixed;    /* 要素の位置計算に影響 */
    transform: translateY(100px); /* 要素の表示位置が変更される */
}
```

このような変更を動的に行う場合は、変更後に手動でトリガー更新を実行することを推奨します：

```javascript
// CSS変更後の手動更新
setTimeout(() => {
    scrolly.updateCurrentTrigger();
}, 100);
```

### data-trigger属性の設定

各監視対象要素には、一意のtrigger IDを設定する必要があります：

```html
<!-- ✅ 正しい設定 -->
<div class="scroll-section" data-trigger="section1">内容</div>
<div class="scroll-section" data-trigger="section2">内容</div>
<div class="scroll-section" data-trigger="section3">内容</div>

<!-- ❌ 避けるべき設定 -->
<div class="scroll-section" data-trigger="section1">内容</div>
<div class="scroll-section" data-trigger="section1">内容</div> <!-- 重複ID -->
<div class="scroll-section">内容</div> <!-- 属性なし -->
```

## 高度な使用例

### 複数のインスタンス

```javascript
// メインコンテンツ用
const mainScrolly = new Scrolltering({
    selector: '[data-main-trigger]',
    triggerAttribute: 'data-main-trigger',
    onChange: (detail) => {
        updateMainContent(detail.current);
    }
});

// サイドバー用
const sidebarScrolly = new Scrolltering({
    selector: '[data-sidebar-trigger]',
    triggerAttribute: 'data-sidebar-trigger',
    onChange: (detail) => {
        updateSidebar(detail.current);
    }
});

// イベントベースで複数インスタンスを識別する場合
window.addEventListener('scrollTrigger', (event) => {
    const { instanceId, current } = event.detail;
    
    if (instanceId === mainScrolly.instanceId) {
        // メインコンテンツの処理
    } else if (instanceId === sidebarScrolly.instanceId) {
        // サイドバーの処理
    }
});
```

### 動的な要素の追加/削除

```javascript
const scrolly = new Scrolltering();

// 新しい要素を追加
const newElement = document.createElement('div');
newElement.setAttribute('data-trigger', 'dynamic-section');
document.body.appendChild(newElement);
scrolly.observe(newElement);

// 要素を削除
scrolly.unobserve(newElement);
newElement.remove();
```

### プログレスバーの実装例

```javascript
const scrolly = new Scrolltering({
    threshold: [0, 0.25, 0.5, 0.75, 1] // 複数の閾値
});

const sections = ['intro', 'section1', 'section2', 'conclusion'];
const progressBar = document.getElementById('progress');

window.addEventListener('scrollTrigger', (event) => {
    const currentIndex = sections.indexOf(event.detail.current);
    const progress = ((currentIndex + 1) / sections.length) * 100;
    progressBar.style.width = `${progress}%`;
});
```

## トラブルシューティング

Scrollteringが期待通りに動作しない場合の診断と解決方法です。

### スクロールイベントが発火しない主なケース

#### 1. 要素の高さが不十分

**症状**: スクロールしてもトリガーが変更されない
**原因**: セクション要素の高さがビューポートより小さい
**解決方法**:
```css
.scroll-section {
    min-height: 100vh; /* 最低限ビューポート高さを確保 */
    min-height: 120vh; /* より確実に検出させる場合 */
}
```

#### 2. overflow設定による問題

**症状**: 全くイベントが発火しない
**原因**: `overflow: hidden`によりスクロールが無効化されている
**診断方法**:
```javascript
// スクロール可能かチェック
console.log('scrollHeight:', document.body.scrollHeight);
console.log('clientHeight:', document.documentElement.clientHeight);
// scrollHeight > clientHeight であることを確認
```

#### 3. threshold設定の問題

**症状**: 要素が完全に表示されるまでトリガーが変更されない
**原因**: threshold値が大きすぎる（例：1.0）
**解決方法**:
```javascript
const scrolly = new Scrolltering({
    threshold: 0.1, // 10%表示されたら発火（推奨）
    // threshold: 1.0 // ❌ 100%表示まで待つ（非推奨）
});
```

#### 4. 要素の可視性問題

**症状**: 特定の要素でのみイベントが発火しない
**診断方法**:
```javascript
// 要素の状態をチェック
const element = document.querySelector('[data-trigger="問題の要素"]');
const styles = window.getComputedStyle(element);
console.log('display:', styles.display); // 'none'でないことを確認
console.log('visibility:', styles.visibility); // 'hidden'でないことを確認
console.log('opacity:', styles.opacity); // 0でも監視される
```

#### 5. 動的コンテンツの問題

**症状**: 後から追加された要素が監視されない
**解決方法**:
```javascript
// 動的に要素を追加した後
const newElement = document.createElement('div');
newElement.setAttribute('data-trigger', 'new-section');
document.body.appendChild(newElement);

// 手動で監視対象に追加
scrolly.observe(newElement);
```

#### 6. CSS transformの影響

**症状**: transform適用要素でトリガーが正しく発火しない
**原因**: `transform`プロパティによる位置計算の変更
**解決方法**:
```javascript
// transform変更後に手動更新
element.style.transform = 'translateY(100px)';
setTimeout(() => {
    scrolly.updateCurrentTrigger();
}, 100);
```

### デバッグ方法

#### 1. 基本的な動作確認

```javascript
// システムの初期化確認
console.log('Scrolltering ID:', scrolly.instanceId);
console.log('Current trigger:', scrolly.getCurrentTriggerId());

// 監視対象要素の確認
const elements = document.querySelectorAll('[data-trigger]');
console.log('監視対象要素数:', elements.length);
elements.forEach(el => {
    console.log('要素:', el.getAttribute('data-trigger'), 
                '高さ:', el.offsetHeight);
});
```

#### 2. IntersectionObserverの動作確認

```javascript
// 手動でIntersectionObserverをテスト
const testObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        console.log('要素:', entry.target.getAttribute('data-trigger'),
                   '交差中:', entry.isIntersecting,
                   '交差率:', entry.intersectionRatio);
    });
});

document.querySelectorAll('[data-trigger]').forEach(el => {
    testObserver.observe(el);
});
```

#### 3. ブラウザ開発者ツールでの確認

1. **Elements タブ**: 要素の存在とdata-trigger属性を確認
2. **Console タブ**: エラーメッセージの確認
3. **Performance タブ**: IntersectionObserverイベントの発火確認

### よくある質問と解決策

**Q: モバイルデバイスで動作しない**
A: ビューポートメタタグを確認してください：
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**Q: iframe内で動作しない**
A: iframe内では親ウィンドウのスクロールを監視できません。iframe内専用のインスタンスを作成してください。

**Q: 高速スクロール時にイベントが発火しない**
A: debounceDelay を短くしてください：
```javascript
const scrolly = new Scrolltering({
    debounceDelay: 5 // デフォルト10msを短縮
});
```

## オプション詳細

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| selector | string | '[data-trigger]' | 監視対象要素のCSSセレクタ |
| triggerAttribute | string | 'data-trigger' | トリガーIDを格納する属性名 |
| threshold | number/array | 0 | 交差の閾値（0-1の値、または配列） |
| rootMargin | string | '0px' | ルート要素のマージン |
| debounceDelay | number | 10 | デバウンス遅延時間（ミリ秒） |
| onChange | function | null | トリガー変更時のコールバック関数 |

## パフォーマンス最適化

Scrollteringの性能を最大化するための詳細なガイドです。

### 基本的な最適化

#### 1. 適切なthreshold設定
```javascript
// ❌ 計算負荷が高い設定
const scrolly = new Scrolltering({
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
});

// ✅ 必要最小限の設定
const scrolly = new Scrolltering({
    threshold: 0.3 // 単一の値を推奨
});
```

#### 2. デバウンス遅延の最適化
```javascript
// 用途に応じた設定
const scrolly = new Scrolltering({
    debounceDelay: 10,  // 高頻度更新が必要な場合
    debounceDelay: 50,  // 一般的な用途（推奨）
    debounceDelay: 100  // 低頻度で十分な場合
});
```

### 大量要素の監視時の最適化

#### 1. 要素数の管理
```javascript
// 現在監視中の要素数を確認
console.log('監視中要素数:', scrolly.visibleElements.size);

// 不要な要素の除去
document.querySelectorAll('.removed-section').forEach(element => {
    scrolly.unobserve(element);
});
```

#### 2. 段階的な要素追加
```javascript
// ❌ 一度に大量の要素を追加
const allElements = document.querySelectorAll('.scroll-section');
allElements.forEach(el => scrolly.observe(el));

// ✅ 段階的な追加
const addElementsGradually = (elements, batchSize = 10) => {
    let index = 0;
    const addBatch = () => {
        for (let i = 0; i < batchSize && index < elements.length; i++, index++) {
            scrolly.observe(elements[index]);
        }
        if (index < elements.length) {
            requestAnimationFrame(addBatch);
        }
    };
    addBatch();
};
```

### メモリ使用量の最適化

#### 1. 適切なクリーンアップ
```javascript
// SPA環境でのページ遷移時
window.addEventListener('beforeunload', () => {
    scrolly.destroy(); // 必須
});

// React/Vue等でのコンポーネントアンマウント時
useEffect(() => {
    return () => {
        scrolly.destroy();
    };
}, []);
```

#### 2. インスタンス数の管理
```javascript
// ❌ 不要な複数インスタンス
const scrolly1 = new Scrolltering({ selector: '.section1' });
const scrolly2 = new Scrolltering({ selector: '.section2' });
const scrolly3 = new Scrolltering({ selector: '.section3' });

// ✅ 単一インスタンスでの管理
const scrolly = new Scrolltering({
    selector: '.section1, .section2, .section3'
});
```

### レンダリング性能の最適化

#### 1. CSS変更の最小化
```javascript
// ❌ DOM操作が頻繁
scrolly.onChange = ({ current }) => {
    document.querySelectorAll('.section').forEach(el => {
        el.classList.remove('active'); // 全要素を毎回更新
    });
    document.querySelector(`[data-trigger="${current}"]`).classList.add('active');
};

// ✅ 必要最小限の操作
let previousElement = null;
scrolly.onChange = ({ current }) => {
    if (previousElement) {
        previousElement.classList.remove('active');
    }
    const currentElement = document.querySelector(`[data-trigger="${current}"]`);
    currentElement.classList.add('active');
    previousElement = currentElement;
};
```

#### 2. requestAnimationFrameの活用
```javascript
scrolly.onChange = ({ current }) => {
    requestAnimationFrame(() => {
        // DOM操作をフレーム境界で実行
        updateUI(current);
    });
};
```

### パフォーマンス測定

#### 1. 基本的な計測
```javascript
// IntersectionObserverイベントの頻度測定
let eventCount = 0;
const startTime = Date.now();

scrolly.onChange = ({ current }) => {
    eventCount++;
    if (eventCount % 10 === 0) {
        const elapsed = Date.now() - startTime;
        console.log(`10イベント処理時間: ${elapsed}ms`);
    }
};
```

#### 2. メモリ使用量の監視
```javascript
// 定期的なメモリ使用量チェック
setInterval(() => {
    if (performance.memory) {
        console.log('メモリ使用量:', {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
        });
    }
}, 5000);
```

## ブラウザサポート

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 15+

IE11で使用する場合は、IntersectionObserverのポリフィルが必要：

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver"></script>
```

## 改善点とベストプラクティス

### 実装された改善点

1. **カスタムコールバック対応**
   - `onChange`オプションでコールバック関数を直接指定可能
   - イベントリスナーよりもシンプルで効率的

2. **メモリリーク防止**
   - デバウンスタイマーを`_debounceTimer`で管理
   - `destroy()`時に確実にクリア

3. **初期トリガーの即時発火**
   - `setup()`完了後に`updateCurrentTrigger()`を実行
   - ページロード時の初期状態を正しく認識

4. **インスタンス識別**
   - ユニークな`instanceId`を自動生成
   - 複数インスタンス使用時の識別が容易

### 設計上の注意点

1. **シンプルさの維持**
   - 過度な機能追加は避け、基本機能に集中
   - 必要に応じて拡張可能な設計

2. **パフォーマンスの考慮**
   - デバウンス処理で過度な更新を防止
   - IntersectionObserverの効率的な使用

3. **互換性の確保**
   - イベントベースとコールバックベースの両対応
   - 既存コードへの影響を最小限に

## まとめ

このScrollteringクラスは、スクロールトリガリングの基本的な機能を提供する汎用的なソリューションです。改善されたメモリ管理、柔軟なコールバック対応、初期状態の適切な処理により、より堅牢で使いやすいシステムになっています。イベント発火後の処理は完全にカスタマイズ可能で、様々なプロジェクトに簡単に統合できます。
