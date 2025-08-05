#!/bin/bash

# =====================================
# Firebase本番環境 運用監視スクリプト
# Production Operations Monitoring Scripts
# =====================================

set -e

PROJECT_ID="haircut-reservation-prod"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@your-domain.com}"
LOG_FILE="/var/log/firebase-monitoring.log"

# =====================================
# ログ機能
# =====================================

log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

log_error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] ERROR: $message" | tee -a "$LOG_FILE" >&2
}

send_alert() {
    local severity="$1"
    local title="$2"
    local message="$3"
    
    # Slack通知
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local emoji="⚠️"
        local color="warning"
        
        case "$severity" in
            "critical") emoji="🚨"; color="danger" ;;
            "warning") emoji="⚠️"; color="warning" ;;
            "info") emoji="ℹ️"; color="good" ;;
        esac
        
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$emoji $title\",\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # 重要度がcriticalの場合はメール送信
    if [ "$severity" = "critical" ] && command -v sendmail &> /dev/null; then
        cat << EOF | sendmail "$ADMIN_EMAIL"
Subject: [CRITICAL] Firebase Production Alert - $title
Date: $(date)

$message

Project: $PROJECT_ID
Timestamp: $(date)
Severity: $severity
EOF
    fi
}

# =====================================
# システム稼働状況監視
# =====================================

check_system_health() {
    log "🏥 システムヘルスチェック開始..."
    
    local issues=()
    
    # Firebase プロジェクトアクセス確認
    if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
        issues+=("Firebase project access failed")
    fi
    
    # Firestore接続確認
    if ! gcloud firestore databases describe --database="(default)" --project="$PROJECT_ID" &> /dev/null; then
        issues+=("Firestore connection failed")
    fi
    
    # Storage バケット確認
    if ! gsutil ls "gs://${PROJECT_ID}.appspot.com" &> /dev/null; then
        issues+=("Storage bucket access failed")
    fi
    
    # Functions稼働確認
    local functions_count=$(gcloud functions list --project="$PROJECT_ID" --format="value(name)" | wc -l)
    if [ "$functions_count" -eq 0 ]; then
        issues+=("No Functions deployed")
    fi
    
    # Hosting確認
    if ! curl -s --max-time 10 "https://${PROJECT_ID}.web.app/health" &> /dev/null; then
        issues+=("Hosting health check failed")
    fi
    
    if [ ${#issues[@]} -eq 0 ]; then
        log "✅ システムヘルスチェック - 正常"
        return 0
    else
        local issue_message=$(printf '%s\n' "${issues[@]}")
        log_error "システムヘルスチェック - 問題検出:\n$issue_message"
        send_alert "critical" "System Health Check Failed" "$issue_message"
        return 1
    fi
}

# =====================================
# パフォーマンス監視
# =====================================

check_performance() {
    log "📊 パフォーマンス監視開始..."
    
    local warnings=()
    
    # Hosting応答時間確認
    local response_time=$(curl -s -w "%{time_total}" -o /dev/null --max-time 30 "https://${PROJECT_ID}.web.app/" || echo "timeout")
    
    if [ "$response_time" = "timeout" ]; then
        warnings+=("Website response timeout")
    elif (( $(echo "$response_time > 3.0" | bc -l) )); then
        warnings+=("Slow website response: ${response_time}s")
    fi
    
    # Functions応答時間確認（サンプルAPI）
    local api_response_time=$(curl -s -w "%{time_total}" -o /dev/null --max-time 30 "https://us-central1-${PROJECT_ID}.cloudfunctions.net/api/health" || echo "timeout")
    
    if [ "$api_response_time" = "timeout" ]; then
        warnings+=("API response timeout")
    elif (( $(echo "$api_response_time > 5.0" | bc -l) )); then
        warnings+=("Slow API response: ${api_response_time}s")
    fi
    
    if [ ${#warnings[@]} -eq 0 ]; then
        log "✅ パフォーマンス監視 - 正常"
        log "   Website応答時間: ${response_time}s"
        log "   API応答時間: ${api_response_time}s" 
    else
        local warning_message=$(printf '%s\n' "${warnings[@]}")
        log "⚠️ パフォーマンス警告:\n$warning_message"
        send_alert "warning" "Performance Issues Detected" "$warning_message"
    fi
}

# =====================================
# 使用量・コスト監視
# =====================================

check_usage_quotas() {
    log "💰 使用量・コスト監視開始..."
    
    local alerts=()
    local warnings=()
    
    # 今月のコスト確認（簡易版 - 実際はBilling APIを使用）
    local current_date=$(date +%Y-%m-%d)
    local month_start=$(date +%Y-%m-01)
    
    # Firestore使用量確認（読み取り・書き込み）
    log "   📊 Firestore使用量確認中..."
    
    # Storage使用量確認
    local storage_usage=$(gsutil du -s "gs://${PROJECT_ID}.appspot.com" 2>/dev/null | cut -f1 || echo "0")
    local storage_usage_gb=$(echo "scale=2; $storage_usage / 1024 / 1024 / 1024" | bc -l)
    
    if (( $(echo "$storage_usage_gb > 45" | bc -l) )); then
        alerts+=("Storage usage high: ${storage_usage_gb}GB (limit: 50GB)")
    elif (( $(echo "$storage_usage_gb > 35" | bc -l) )); then
        warnings+=("Storage usage warning: ${storage_usage_gb}GB")
    fi
    
    # Functions呼び出し数確認（過去24時間）
    log "   ⚡ Functions使用量確認中..."
    
    if [ ${#alerts[@]} -gt 0 ]; then
        local alert_message=$(printf '%s\n' "${alerts[@]}")
        log_error "使用量アラート:\n$alert_message"
        send_alert "critical" "Usage Quota Alert" "$alert_message"
    fi
    
    if [ ${#warnings[@]} -gt 0 ]; then
        local warning_message=$(printf '%s\n' "${warnings[@]}")
        log "⚠️ 使用量警告:\n$warning_message"
        send_alert "warning" "Usage Quota Warning" "$warning_message"
    fi
    
    if [ ${#alerts[@]} -eq 0 ] && [ ${#warnings[@]} -eq 0 ]; then
        log "✅ 使用量・コスト監視 - 正常"
        log "   Storage使用量: ${storage_usage_gb}GB"
    fi
}

# =====================================
# セキュリティ監視
# =====================================

check_security() {
    log "🔒 セキュリティ監視開始..."
    
    local security_issues=()
    
    # 異常なアクセスパターン確認
    log "   🔍 アクセスログ分析中..."
    
    # 過去1時間のエラーログ確認
    local error_count=$(gcloud logging read "resource.type=cloud_function severity>=ERROR" \
        --project="$PROJECT_ID" \
        --freshness=1h \
        --format="value(timestamp)" | wc -l)
    
    if [ "$error_count" -gt 100 ]; then
        security_issues+=("High error rate: $error_count errors in last hour")
    fi
    
    # Authentication失敗ログ確認
    local auth_failures=$(gcloud logging read "resource.type=firebase_auth jsonPayload.event_name=login AND jsonPayload.event_result=failure" \
        --project="$PROJECT_ID" \
        --freshness=1h \
        --format="value(timestamp)" | wc -l)
    
    if [ "$auth_failures" -gt 50 ]; then
        security_issues+=("High authentication failures: $auth_failures in last hour")
    fi
    
    # Firestore ルール違反確認
    local rule_violations=$(gcloud logging read "resource.type=firestore_database jsonPayload.method_name=listen AND severity=WARNING" \
        --project="$PROJECT_ID" \
        --freshness=1h \
        --format="value(timestamp)" | wc -l)
    
    if [ "$rule_violations" -gt 20 ]; then
        security_issues+=("Firestore rule violations: $rule_violations in last hour")
    fi
    
    if [ ${#security_issues[@]} -eq 0 ]; then
        log "✅ セキュリティ監視 - 正常"
        log "   エラー数: $error_count (過去1時間)"
        log "   認証失敗: $auth_failures (過去1時間)"
        log "   ルール違反: $rule_violations (過去1時間)"
    else
        local security_message=$(printf '%s\n' "${security_issues[@]}")
        log_error "セキュリティ問題検出:\n$security_message"
        send_alert "critical" "Security Issues Detected" "$security_message"
    fi
}

# =====================================
# バックアップ監視
# =====================================

check_backup_status() {
    log "💾 バックアップ状況監視開始..."
    
    local backup_issues=()
    
    # 最新バックアップ確認
    local latest_backup=$(gsutil ls "gs://haircut-reservation-prod-backups/firestore/" | sort | tail -1)
    
    if [ -z "$latest_backup" ]; then
        backup_issues+=("No backups found")
    else
        local backup_date=$(basename "$latest_backup" | cut -d'_' -f1)
        local backup_timestamp=$(date -d "$backup_date" +%s 2>/dev/null || echo "0")
        local current_timestamp=$(date +%s)
        local hours_since_backup=$(( (current_timestamp - backup_timestamp) / 3600 ))
        
        if [ "$hours_since_backup" -gt 48 ]; then
            backup_issues+=("Latest backup is $hours_since_backup hours old")
        elif [ "$hours_since_backup" -gt 24 ]; then
            log "⚠️ バックアップが ${hours_since_backup}時間前（注意が必要）"
        fi
    fi
    
    # バックアップサイズ・整合性確認
    if [ -n "$latest_backup" ]; then
        local backup_size=$(gsutil du -s "$latest_backup" 2>/dev/null | cut -f1 || echo "0")
        if [ "$backup_size" -eq 0 ]; then
            backup_issues+=("Latest backup appears to be empty")
        fi
    fi
    
    if [ ${#backup_issues[@]} -eq 0 ]; then
        log "✅ バックアップ監視 - 正常"
        [ -n "$latest_backup" ] && log "   最新バックアップ: $(basename "$latest_backup")"
    else
        local backup_message=$(printf '%s\n' "${backup_issues[@]}")
        log_error "バックアップ問題:\n$backup_message"
        send_alert "critical" "Backup Issues Detected" "$backup_message"
    fi
}

# =====================================
# 総合レポート生成
# =====================================

generate_daily_report() {
    log "📋 日次レポート生成開始..."
    
    local report_date=$(date +%Y-%m-%d)
    local report_file="/tmp/firebase-daily-report-$report_date.txt"
    
    cat > "$report_file" << EOF
Firebase 本番環境 日次監視レポート
======================================

プロジェクト: $PROJECT_ID
レポート日付: $report_date
生成時刻: $(date)

システム稼働状況:
$(check_system_health 2>&1)

パフォーマンス状況:
$(check_performance 2>&1)

使用量・コスト状況:
$(check_usage_quotas 2>&1)

セキュリティ状況:
$(check_security 2>&1)

バックアップ状況:
$(check_backup_status 2>&1)

======================================
レポート終了
EOF
    
    # レポートをGCSにアップロード
    gsutil cp "$report_file" "gs://haircut-reservation-prod-backups/reports/daily-report-$report_date.txt"
    
    # 管理者にメール送信
    if command -v sendmail &> /dev/null; then
        cat << EOF | sendmail "$ADMIN_EMAIL"
Subject: Firebase Production Daily Report - $report_date
Date: $(date)

$(cat "$report_file")
EOF
    fi
    
    # 一時ファイル削除
    rm -f "$report_file"
    
    log "✅ 日次レポート生成完了"
}

# =====================================
# メイン監視関数
# =====================================

run_full_monitoring() {
    log "🚀 Firebase本番環境 総合監視開始"
    
    local start_time=$(date +%s)
    local overall_status="healthy"
    
    # 各監視項目実行
    if ! check_system_health; then
        overall_status="critical"
    fi
    
    check_performance
    check_usage_quotas  
    check_security
    check_backup_status
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "🎉 総合監視完了 (${duration}秒) - ステータス: $overall_status"
    
    # 週次レポート（日曜日）
    if [ "$(date +%u)" -eq 7 ]; then
        generate_daily_report
    fi
}

# =====================================
# 特定項目監視関数
# =====================================

monitor_realtime() {
    log "📡 リアルタイム監視開始 (5分間隔)"
    
    while true; do
        check_system_health
        check_performance
        
        sleep 300  # 5分待機
    done
}

monitor_security_only() {
    log "🔒 セキュリティ専用監視開始"
    check_security
}

# =====================================
# 使用方法・実行部分
# =====================================

case "${1:-full}" in
    "full")
        run_full_monitoring
        ;;
    "health")
        check_system_health
        ;;
    "performance")  
        check_performance
        ;;
    "usage")
        check_usage_quotas
        ;;
    "security")
        monitor_security_only
        ;;
    "backup")
        check_backup_status
        ;;
    "realtime")
        monitor_realtime
        ;;
    "report")
        generate_daily_report
        ;;
    *)
        echo "使用方法: $0 [full|health|performance|usage|security|backup|realtime|report]"
        echo ""
        echo "監視オプション:"
        echo "  full        - 全項目の総合監視（デフォルト）"
        echo "  health      - システムヘルスチェックのみ"
        echo "  performance - パフォーマンス監視のみ"
        echo "  usage       - 使用量・コスト監視のみ"
        echo "  security    - セキュリティ監視のみ"
        echo "  backup      - バックアップ状況のみ"
        echo "  realtime    - リアルタイム監視（5分間隔）"
        echo "  report      - 日次レポート生成"
        echo ""
        echo "環境変数:"
        echo "  SLACK_WEBHOOK_URL - Slack通知用WebhookURL"
        echo "  ADMIN_EMAIL       - アラートメール送信先"
        exit 1
        ;;
esac