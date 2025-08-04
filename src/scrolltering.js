/**
 * Simple Scrolly Triggering System
 * IntersectionObserverを使用したシンプルなスクロールトリガリングシステム
 * 
 * 従来のスクロールイベントと異なり、IntersectionObserverは要素のビューポートとの交差を
 * 効率的に監視します。これにより、パフォーマンスの向上とバッテリー消費の削減を実現します。
 * 
 * @class ScrollySystem
 * 
 * @example
 * // コールバック方式（推奨）
 * const scrolly = new ScrollySystem({
 *   threshold: 0.5,
 *   onChange: ({ current, previous }) => {
 *     console.log(`${previous} から ${current} に変更`);
 *   }
 * });
 */
class ScrollySystem {
    /**
     * ScrollySystemのコンストラクタ
     * 
     * @param {Object} options - 設定オプション
     * @param {string} [options.selector='[data-trigger]'] - 監視対象要素のCSSセレクタ
     * @param {string} [options.triggerAttribute='data-trigger'] - トリガーIDを格納する属性名
     * @param {number|number[]} [options.threshold=0] - 交差の閾値（0-1の値、または配列）
     * @param {string} [options.rootMargin='0px'] - ルート要素のマージン（CSS margin形式）
     * @param {number} [options.debounceDelay=10] - デバウンス遅延時間（ミリ秒）
     * @param {Function} [options.onChange=null] - トリガー変更時のコールバック関数
     * @param {boolean} [options.debug=false] - デバッグモードの有効化
     */
    constructor(options = {}) {
        // デフォルト設定
        this.config = {
            selector: '[data-trigger]',        // 監視対象のセレクタ
            triggerAttribute: 'data-trigger',  // トリガーID属性名
            threshold: 0,                      // 交差の閾値
            rootMargin: '0px',                 // ルートマージン
            debounceDelay: 10,                 // デバウンス遅延時間(ms)
            onChange: null,                    // カスタムコールバック
            debug: false,                      // デバッグモード
            ...options
        };
        
        this.observer = null;
        this.visibleElements = new Map();
        this.currentTriggerId = null;
        this.lastValidTriggerId = null;
        this._debounceTimer = null;           // タイマー管理用
        this.instanceId = `scrolly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // ユニークなインスタンスID
        this._diagnosticCache = new Map();    // 診断結果のキャッシュ
        
        this.init();
    }
    
    /**
     * システムの初期化
     * デバウンス関数の準備とDOMの準備状態に応じた処理を行います
     * 
     * @private
     */
    init() {
        // デバウンス関数の準備
        this.debouncedUpdate = this.debounce(
            () => this.updateCurrentTrigger(), 
            this.config.debounceDelay
        );
        
        // DOMが準備できたら開始
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    /**
     * IntersectionObserverのセットアップと初期評価
     * ObserverとDOM要素の監視を開始し、初期状態を評価します
     * 
     * @private
     */
    setup() {
        this.setupObserver();
        // 初期状態を即座に評価
        this.updateCurrentTrigger();
    }
    
    /**
     * IntersectionObserverの作成と設定
     * 
     * IntersectionObserverは要素がビューポートと交差する瞬間を効率的に検出します。
     * 従来のscrollイベントと比較して以下の利点があります：
     * - メインスレッドをブロックしない非同期処理
     * - ブラウザによる最適化（フレーム単位での処理）
     * - バッテリー消費の削減
     * 
     * @private
     */
    setupObserver() {
        const options = {
            threshold: this.config.threshold,
            rootMargin: this.config.rootMargin
        };
        
        // IntersectionObserverのコールバック関数
        // entries: 交差状態が変化した要素の配列
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                const triggerId = element.getAttribute(this.config.triggerAttribute);
                
                // entry.isIntersecting: 要素がビューポートと交差しているかどうか
                // threshold設定に基づいて交差判定が行われる
                if (entry.isIntersecting) {
                    // 要素が画面内に入った場合、Mapに追加
                    this.visibleElements.set(element, triggerId);
                } else {
                    // 要素が画面外に出た場合、Mapから削除
                    this.visibleElements.delete(element);
                }
            });
            
            // デバウンス処理を適用してトリガー更新を実行
            // 連続した交差イベントによるパフォーマンス低下を防ぐ
            this.debouncedUpdate();
        }, options);
        
        // 監視対象の要素を登録
        const targets = document.querySelectorAll(this.config.selector);
        targets.forEach(target => this.observer.observe(target));
    }
    
    /**
     * 現在アクティブなトリガーの更新
     * 
     * 画面内に表示されている要素の中から、最も上に位置する要素を
     * 現在のトリガーとして選択します。これにより、スクロール位置に
     * 応じた適切なセクション判定を実現します。
     * 
     * @private
     */
    updateCurrentTrigger() {
        const entries = Array.from(this.visibleElements.entries());
        
        if (entries.length > 0) {
            // 画面内で最も上にある要素を取得
            // getBoundingClientRect()でビューポート相対位置を取得し、
            // top値が最小（最上位）の要素を選択する
            const topEntry = entries.reduce((prev, curr) => {
                const prevRect = prev[0].getBoundingClientRect();
                const currRect = curr[0].getBoundingClientRect();
                return currRect.top < prevRect.top ? curr : prev;
            });
            
            const triggerId = topEntry[1];
            this.lastValidTriggerId = triggerId;
            this.setCurrentTrigger(triggerId);
        } else {
            // 画面内に要素がない場合（すべての要素が画面外）
            // このケースは、要素間のスペースが大きい場合や
            // 高速スクロール時に発生する可能性がある
            if (this.lastValidTriggerId !== null) {
                // 最後の有効なトリガーを維持することで、
                // トリガーが突然消失することを防ぐ
                this.setCurrentTrigger(this.lastValidTriggerId);
            }
        }
    }
    
    /**
     * 現在のトリガーIDを設定し、変更イベントを発火
     * 
     * @param {string} triggerId - 設定するトリガーID
     * @private
     */
    setCurrentTrigger(triggerId) {
        if (this.currentTriggerId !== triggerId) {
            const previousTriggerId = this.currentTriggerId;
            this.currentTriggerId = triggerId;
            
            // カスタムイベントを発火
            this.emitTriggerChange(triggerId, previousTriggerId);
        }
    }
    
    /**
     * トリガー変更イベントの発火
     * 
     * コールバック関数とカスタムイベントの両方を発火することで、
     * 異なる使用パターンに対応します。
     * 
     * @param {string} currentId - 現在のトリガーID
     * @param {string} previousId - 前回のトリガーID
     * @private
     */
    emitTriggerChange(currentId, previousId) {
        const detail = {
            current: currentId,
            previous: previousId,
            timestamp: Date.now(),
            instanceId: this.instanceId
        };
        
        // カスタムコールバックがあれば実行
        if (typeof this.config.onChange === 'function') {
            this.config.onChange(detail);
        }
        
        // イベントも発火（互換性のため）
        const event = new CustomEvent('scrollTrigger', { detail });
        window.dispatchEvent(event);
    }
    
    /**
     * デバウンス関数のユーティリティ
     * 
     * 短時間に連続して呼び出される関数の実行を制限し、
     * 最後の呼び出しから指定時間後に一度だけ実行します。
     * これにより、IntersectionObserverからの頻繁なコールバックによる
     * パフォーマンス低下を防ぎます。
     * 
     * @param {Function} func - デバウンス対象の関数
     * @param {number} wait - 待機時間（ミリ秒）
     * @returns {Function} デバウンス処理が適用された関数
     * @private
     */
    debounce(func, wait) {
        return (...args) => {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    /**
     * 現在のトリガーIDを取得
     * 
     * @returns {string|null} 現在のトリガーID、または未設定の場合はnull
     * @public
     */
    getCurrentTriggerId() {
        return this.currentTriggerId;
    }
    
    /**
     * 要素を動的に監視対象に追加
     * 
     * ページの動的コンテンツや遅延読み込みされた要素を
     * 後から監視対象に追加する際に使用します。
     * 
     * @param {Element} element - 監視対象に追加する要素
     * @public
     */
    observe(element) {
        if (this.observer && element) {
            this.observer.observe(element);
        }
    }
    
    /**
     * 要素を動的に監視対象から削除
     * 
     * 不要になった要素を監視対象から除外し、
     * メモリリークを防ぎます。
     * 
     * @param {Element} element - 監視対象から削除する要素
     * @public
     */
    unobserve(element) {
        if (this.observer && element) {
            this.observer.unobserve(element);
            this.visibleElements.delete(element);
        }
    }
    
    /**
     * システムの完全な破棄とクリーンアップ
     * 
     * すべてのリソース（タイマー、Observer、内部状態）を解放し、
     * メモリリークを防ぎます。SPA環境でのページ遷移時や、
     * コンポーネントのアンマウント時に呼び出すことを推奨します。
     * 
     * @public
     */
    destroy() {
        // タイマーをクリア
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        
        // IntersectionObserverを完全に切断
        // disconnect()ですべての監視対象が解除される
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // 内部状態をクリア
        this.visibleElements.clear();
        this.currentTriggerId = null;
        this.lastValidTriggerId = null;
        this._diagnosticCache.clear();
    }

    /**
     * システム全体の診断を実行
     * 
     * HTML構築時の注意点をチェックし、問題を特定します。
     * 開発時のデバッグに有用で、パフォーマンス問題や設定ミスを検出できます。
     * 
     * @param {boolean} [verbose=false] - 詳細な診断結果を出力するかどうか
     * @returns {Object} 診断結果オブジェクト
     * @public
     */
    diagnose(verbose = false) {
        const cacheKey = `diagnose_${verbose}`;
        if (this._diagnosticCache.has(cacheKey)) {
            return this._diagnosticCache.get(cacheKey);
        }

        const issues = [];
        const elements = document.querySelectorAll(this.config.selector);
        
        // 要素関連の診断
        const elementIssues = this.validateElements();
        issues.push(...elementIssues);
        
        // パフォーマンス関連の診断
        const performanceIssues = this.checkPerformance();
        issues.push(...performanceIssues);
        
        // 環境関連の診断
        const environmentIssues = this._checkEnvironment();
        issues.push(...environmentIssues);

        // 診断結果の作成
        const result = {
            status: this._determineStatus(issues),
            issues: issues,
            summary: {
                totalElements: elements.length,
                problematicElements: this._countProblematicElements(issues),
                performanceScore: this._calculatePerformanceScore(issues),
                timestamp: Date.now()
            }
        };

        // デバッグモードまたはverboseモードの場合、コンソールに出力
        if (this.config.debug || verbose) {
            this._outputDiagnosticResults(result);
        }

        // 結果をキャッシュ（5秒間）
        this._diagnosticCache.set(cacheKey, result);
        setTimeout(() => {
            this._diagnosticCache.delete(cacheKey);
        }, 5000);

        return result;
    }

    /**
     * 監視対象要素の妥当性をチェック
     * 
     * @returns {Array} 要素関連の問題配列
     * @private
     */
    validateElements() {
        const issues = [];
        const elements = document.querySelectorAll(this.config.selector);
        const triggerIds = new Set();
        const viewportHeight = window.innerHeight;

        if (elements.length === 0) {
            issues.push({
                type: 'no_elements',
                severity: 'error',
                message: '監視対象要素が見つかりません',
                suggestion: `セレクタ "${this.config.selector}" に一致する要素を追加してください`
            });
            return issues;
        }

        elements.forEach((element, index) => {
            const triggerId = element.getAttribute(this.config.triggerAttribute);
            const rect = element.getBoundingClientRect();
            const styles = window.getComputedStyle(element);

            // data-trigger属性のチェック
            if (!triggerId) {
                issues.push({
                    type: 'missing_trigger_id',
                    severity: 'error',
                    message: `要素 ${index + 1} にトリガーID属性がありません`,
                    element: element,
                    suggestion: `${this.config.triggerAttribute}="unique-id" を追加してください`
                });
            } else if (triggerIds.has(triggerId)) {
                issues.push({
                    type: 'duplicate_trigger_id',
                    severity: 'error',
                    message: `トリガーID "${triggerId}" が重複しています`,
                    element: element,
                    suggestion: '各要素には一意のトリガーIDを設定してください'
                });
            } else {
                triggerIds.add(triggerId);
            }

            // 要素の高さチェック
            const elementHeight = element.offsetHeight;
            if (elementHeight < viewportHeight * 0.5) {
                issues.push({
                    type: 'insufficient_height',
                    severity: 'warning',
                    message: `要素 "${triggerId || index + 1}" の高さが不十分です (${elementHeight}px)`,
                    element: element,
                    suggestion: 'min-height: 100vh またはそれ以上の高さを設定してください'
                });
            }

            // 可視性のチェック
            if (styles.display === 'none') {
                issues.push({
                    type: 'element_hidden',
                    severity: 'error',
                    message: `要素 "${triggerId || index + 1}" が display: none で非表示です`,
                    element: element,
                    suggestion: 'display: none の代わりに visibility: hidden または opacity: 0 を使用してください'
                });
            } else if (styles.visibility === 'hidden') {
                issues.push({
                    type: 'element_visibility_hidden',
                    severity: 'warning',
                    message: `要素 "${triggerId || index + 1}" が visibility: hidden です`,
                    element: element,
                    suggestion: 'IntersectionObserverは監視しますが、ユーザーには見えません'
                });
            }

            // position: fixed のチェック
            if (styles.position === 'fixed') {
                issues.push({
                    type: 'fixed_position',
                    severity: 'warning',
                    message: `要素 "${triggerId || index + 1}" が position: fixed です`,
                    element: element,
                    suggestion: 'スクロール位置の計算に影響する可能性があります'
                });
            }
        });

        return issues;
    }

    /**
     * パフォーマンス関連の問題をチェック
     * 
     * @returns {Array} パフォーマンス関連の問題配列
     * @private
     */
    checkPerformance() {
        const issues = [];
        const elements = document.querySelectorAll(this.config.selector);

        // 要素数のチェック
        if (elements.length > 50) {
            issues.push({
                type: 'too_many_elements',
                severity: 'warning',
                message: `監視対象要素が多すぎます (${elements.length}個)`,
                suggestion: '50個以下に抑えるか、段階的な要素追加を検討してください'
            });
        }

        // threshold設定のチェック
        if (Array.isArray(this.config.threshold) && this.config.threshold.length > 5) {
            issues.push({
                type: 'complex_threshold',
                severity: 'warning',
                message: `threshold配列が複雑すぎます (${this.config.threshold.length}個の値)`,
                suggestion: '単一の値または最大5個までの配列を推奨します'
            });
        } else if (this.config.threshold === 1.0) {
            issues.push({
                type: 'high_threshold',
                severity: 'warning',
                message: 'threshold: 1.0 は要素が完全に表示されるまで発火しません',
                suggestion: '0.1 - 0.5 程度の値を推奨します'
            });
        }

        // debounceDelay のチェック
        if (this.config.debounceDelay > 100) {
            issues.push({
                type: 'high_debounce',
                severity: 'info',
                message: `debounceDelay が大きすぎる可能性があります (${this.config.debounceDelay}ms)`,
                suggestion: '応答性を重視する場合は50ms以下を推奨します'
            });
        } else if (this.config.debounceDelay < 5) {
            issues.push({
                type: 'low_debounce',
                severity: 'info',
                message: `debounceDelay が小さすぎる可能性があります (${this.config.debounceDelay}ms)`,
                suggestion: 'パフォーマンスを重視する場合は10ms以上を推奨します'
            });
        }

        return issues;
    }

    /**
     * 環境関連の問題をチェック
     * 
     * @returns {Array} 環境関連の問題配列
     * @private
     */
    _checkEnvironment() {
        const issues = [];

        // スクロール可能性のチェック
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );
        const viewportHeight = window.innerHeight;

        if (documentHeight <= viewportHeight) {
            issues.push({
                type: 'no_scroll',
                severity: 'error',
                message: 'ページがスクロール不可能です',
                suggestion: 'コンテンツの高さを増やすか、overflow設定を確認してください'
            });
        }

        // overflow設定のチェック
        const bodyStyles = window.getComputedStyle(document.body);
        const htmlStyles = window.getComputedStyle(document.documentElement);

        if (bodyStyles.overflow === 'hidden' || htmlStyles.overflow === 'hidden') {
            issues.push({
                type: 'overflow_hidden',
                severity: 'error',
                message: 'body または html に overflow: hidden が設定されています',
                suggestion: 'overflow-x: hidden のみを使用するか、overflow設定を削除してください'
            });
        }

        // ビューポートメタタグのチェック（モバイル対応）
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            issues.push({
                type: 'no_viewport_meta',
                severity: 'warning',
                message: 'ビューポートメタタグが設定されていません',
                suggestion: '<meta name="viewport" content="width=device-width, initial-scale=1.0"> を追加してください'
            });
        }

        // IntersectionObserver サポートのチェック
        if (!window.IntersectionObserver) {
            issues.push({
                type: 'no_intersection_observer',
                severity: 'error',
                message: 'IntersectionObserverがサポートされていません',
                suggestion: 'ポリフィルを追加するか、対応ブラウザを使用してください'
            });
        }

        return issues;
    }

    /**
     * 問題の重要度から全体のステータスを決定
     * 
     * @param {Array} issues - 問題配列
     * @returns {string} ステータス ('ok', 'warning', 'error')
     * @private
     */
    _determineStatus(issues) {
        if (issues.some(issue => issue.severity === 'error')) {
            return 'error';
        } else if (issues.some(issue => issue.severity === 'warning')) {
            return 'warning';
        }
        return 'ok';
    }

    /**
     * 問題のある要素数をカウント
     * 
     * @param {Array} issues - 問題配列
     * @returns {number} 問題のある要素数
     * @private
     */
    _countProblematicElements(issues) {
        const problematicElements = new Set();
        issues.forEach(issue => {
            if (issue.element) {
                problematicElements.add(issue.element);
            }
        });
        return problematicElements.size;
    }

    /**
     * パフォーマンススコアを計算
     * 
     * @param {Array} issues - 問題配列
     * @returns {number} パフォーマンススコア (0-10)
     * @private
     */
    _calculatePerformanceScore(issues) {
        let score = 10;
        issues.forEach(issue => {
            switch (issue.severity) {
                case 'error':
                    score -= 3;
                    break;
                case 'warning':
                    score -= 1;
                    break;
                case 'info':
                    score -= 0.5;
                    break;
            }
        });
        return Math.max(0, score);
    }

    /**
     * 診断結果をコンソールに出力
     * 
     * @param {Object} result - 診断結果
     * @private
     */
    _outputDiagnosticResults(result) {
        const statusEmoji = {
            'ok': '✅',
            'warning': '⚠️',
            'error': '❌'
        };

        console.group(`${statusEmoji[result.status]} ScrollySystem 診断結果 (ID: ${this.instanceId.split('-').pop()})`);
        
        console.log('📊 概要:', result.summary);
        
        if (result.issues.length > 0) {
            console.group('🔍 検出された問題:');
            result.issues.forEach((issue, index) => {
                const severityEmoji = {
                    'error': '🚫',
                    'warning': '⚠️',
                    'info': 'ℹ️'
                };
                console.log(`${severityEmoji[issue.severity]} ${issue.message}`);
                console.log(`   💡 ${issue.suggestion}`);
                if (issue.element) {
                    console.log('   🎯 要素:', issue.element);
                }
            });
            console.groupEnd();
        } else {
            console.log('✨ 問題は検出されませんでした');
        }
        
        console.groupEnd();
    }
}

// ES6 module として export
export { ScrollySystem };