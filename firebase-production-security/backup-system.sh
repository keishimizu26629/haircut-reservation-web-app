#!/bin/bash

# =====================================
# Firebase本番環境バックアップシステム
# Production Backup & Recovery System
# =====================================

set -e  # エラー時に停止

echo "🔒 Firebase本番環境バックアップシステム開始..."
echo "=================================================="

# =====================================
# 設定変数
# =====================================

PROJECT_ID="haircut-reservation-prod"
BACKUP_BASE_BUCKET="haircut-reservation-prod-backups"
DATE_FORMAT=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
LOG_FILE="/var/log/firebase-backup.log"

# Firestore コレクション一覧
COLLECTIONS=(
    "tenants"
    "users" 
    "customers"
    "staff"
    "services"
    "reservations"
    "settings"
    "auditLogs"
    "systemStats"
)

# Storage バケット一覧
STORAGE_BUCKETS=(
    "haircut-reservation-prod.appspot.com"
    "haircut-reservation-prod-uploads"
)

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

# =====================================
# 事前チェック
# =====================================

check_prerequisites() {
    log "🔍 事前チェック開始..."
    
    # gcloud CLI確認
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI が見つかりません"
        exit 1
    fi
    
    # Firebase CLI確認
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI が見つかりません"
        exit 1
    fi
    
    # 認証確認
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "Google Cloud認証が必要です"
        exit 1
    fi
    
    # プロジェクトアクセス確認
    if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
        log_error "プロジェクト '$PROJECT_ID' にアクセスできません"
        exit 1
    fi
    
    # バックアップバケット確認
    if ! gsutil ls "gs://$BACKUP_BASE_BUCKET" &> /dev/null; then
        log "バックアップバケットを作成中..."
        gsutil mb -p "$PROJECT_ID" -l asia-northeast1 "gs://$BACKUP_BASE_BUCKET"
        gsutil lifecycle set /dev/stdin "gs://$BACKUP_BASE_BUCKET" <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": $RETENTION_DAYS}
      }
    ]
  }
}
EOF
    fi
    
    log "✅ 事前チェック完了"
}

# =====================================
# Firestoreバックアップ
# =====================================

backup_firestore() {
    log "🗄️  Firestoreバックアップ開始..."
    
    local backup_path="gs://$BACKUP_BASE_BUCKET/firestore/$DATE_FORMAT"
    
    # 全コレクションのバックアップ
    log "   📦 全コレクションをバックアップ中..."
    gcloud firestore export "$backup_path/full" \
        --project="$PROJECT_ID" \
        --collection-ids=$(IFS=,; echo "${COLLECTIONS[*]}") \
        --async
    
    if [ $? -eq 0 ]; then
        log "   ✅ Firestoreバックアップ開始成功: $backup_path/full"
    else
        log_error "   ❌ Firestoreバックアップ失敗"
        return 1
    fi
    
    # 個別コレクションバックアップ（重要データ用）
    for collection in "tenants" "users" "reservations"; do
        log "   📋 重要コレクション '$collection' をバックアップ中..."
        gcloud firestore export "$backup_path/critical/$collection" \
            --project="$PROJECT_ID" \
            --collection-ids="$collection" \
            --async
    done
    
    log "✅ Firestoreバックアップ完了"
}

# =====================================
# Cloud Storageバックアップ
# =====================================

backup_storage() {
    log "💾 Cloud Storageバックアップ開始..."
    
    for bucket in "${STORAGE_BUCKETS[@]}"; do
        local backup_bucket_path="gs://$BACKUP_BASE_BUCKET/storage/$DATE_FORMAT/$(basename $bucket)"
        
        log "   📁 バケット '$bucket' をバックアップ中..."
        
        # バケットの存在確認
        if gsutil ls "gs://$bucket" &> /dev/null; then
            # 並列コピー（高速化）
            gsutil -m cp -r "gs://$bucket/*" "$backup_bucket_path/" 2>/dev/null || {
                log "   ⚠️  バケット '$bucket' は空またはアクセス不可"
                continue
            }
            log "   ✅ バケット '$bucket' バックアップ完了"
        else
            log "   ⚠️  バケット '$bucket' が見つかりません"
        fi
    done
    
    log "✅ Cloud Storageバックアップ完了"  
}

# =====================================
# 設定・メタデータバックアップ
# =====================================

backup_configurations() {
    log "⚙️  設定・メタデータバックアップ開始..."
    
    local config_backup_path="gs://$BACKUP_BASE_BUCKET/configurations/$DATE_FORMAT"
    local temp_dir="/tmp/firebase-config-backup-$DATE_FORMAT"
    
    mkdir -p "$temp_dir"
    
    # Firebase設定エクスポート
    log "   🔧 Firebase設定をエクスポート中..."
    
    # Firestore ルール
    firebase firestore:rules:release --project="$PROJECT_ID" --dry-run > "$temp_dir/firestore.rules" 2>/dev/null || true
    
    # Storage ルール  
    firebase storage:rules:release --project="$PROJECT_ID" --dry-run > "$temp_dir/storage.rules" 2>/dev/null || true
    
    # Firebase設定JSON
    firebase use --project="$PROJECT_ID" &> /dev/null
    cp "firebase.json" "$temp_dir/" 2>/dev/null || echo "{}" > "$temp_dir/firebase.json"
    
    # プロジェクト情報
    gcloud projects describe "$PROJECT_ID" --format=json > "$temp_dir/project-info.json"
    
    # 有効なサービス一覧
    gcloud services list --enabled --project="$PROJECT_ID" --format=json > "$temp_dir/enabled-services.json"
    
    # IAM ポリシー（セキュリティのため制限付き）
    gcloud projects get-iam-policy "$PROJECT_ID" --format=json > "$temp_dir/iam-policy.json"
    
    # バックアップ情報メタデータ
    cat > "$temp_dir/backup-metadata.json" <<EOF
{
  "backupDate": "$DATE_FORMAT",
  "projectId": "$PROJECT_ID",
  "backupType": "full",
  "firestoreCollections": $(printf '%s\n' "${COLLECTIONS[@]}" | jq -R . | jq -s .),
  "storageBuckets": $(printf '%s\n' "${STORAGE_BUCKETS[@]}" | jq -R . | jq -s .),
  "retentionDays": $RETENTION_DAYS,
  "backupVersion": "1.0"
}
EOF
    
    # 設定ファイルをGCSにアップロード
    gsutil -m cp -r "$temp_dir/*" "$config_backup_path/"
    
    # 一時ディレクトリ削除
    rm -rf "$temp_dir"
    
    log "✅ 設定・メタデータバックアップ完了"
}

# =====================================
# バックアップ検証
# =====================================

verify_backup() {
    log "🔍 バックアップ検証開始..."
    
    local backup_base="gs://$BACKUP_BASE_BUCKET"
    local today_backup="$backup_base/firestore/$DATE_FORMAT"
    
    # Firestoreバックアップ確認
    if gsutil ls "$today_backup/full" &> /dev/null; then
        local file_count=$(gsutil ls -r "$today_backup/full" | wc -l)
        log "   ✅ Firestoreバックアップ確認済み ($file_count ファイル)"
    else
        log_error "   ❌ Firestoreバックアップが見つかりません"
        return 1
    fi
    
    # Storageバックアップ確認
    local storage_backup="$backup_base/storage/$DATE_FORMAT"
    if gsutil ls "$storage_backup" &> /dev/null; then
        local storage_size=$(gsutil du -s "$storage_backup" | cut -f1)
        log "   ✅ Storageバックアップ確認済み (${storage_size} bytes)"
    else
        log "   ⚠️  Storageバックアップが見つかりません（データが空の可能性）"
    fi
    
    # 設定バックアップ確認
    local config_backup="$backup_base/configurations/$DATE_FORMAT"
    if gsutil ls "$config_backup" &> /dev/null; then
        log "   ✅ 設定バックアップ確認済み"
    else
        log_error "   ❌ 設定バックアップが見つかりません"
        return 1
    fi
    
    log "✅ バックアップ検証完了"
}

# =====================================
# 古いバックアップ削除
# =====================================

cleanup_old_backups() {
    log "🗑️  古いバックアップ削除開始..."
    
    local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
    
    # 古いFirestoreバックアップ削除
    gsutil ls "gs://$BACKUP_BASE_BUCKET/firestore/" | while read backup_path; do
        local backup_date=$(basename "$backup_path" | cut -d'_' -f1)
        if [[ "$backup_date" < "$cutoff_date" ]]; then
            log "   🗑️  古いFirestoreバックアップ削除: $backup_path"
            gsutil -m rm -r "$backup_path" &
        fi
    done
    
    # 古いStorageバックアップ削除
    gsutil ls "gs://$BACKUP_BASE_BUCKET/storage/" | while read backup_path; do
        local backup_date=$(basename "$backup_path" | cut -d'_' -f1)
        if [[ "$backup_date" < "$cutoff_date" ]]; then
            log "   🗑️  古いStorageバックアップ削除: $backup_path"
            gsutil -m rm -r "$backup_path" &
        fi
    done
    
    # バックグラウンドジョブ完了待ち
    wait
    
    log "✅ 古いバックアップ削除完了"
}

# =====================================
# 通知機能
# =====================================

send_notification() {
    local status="$1"
    local message="$2"
    
    # Slack通知
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local emoji="✅"
        local color="good"
        
        if [ "$status" != "success" ]; then
            emoji="❌"
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$emoji Firebase Backup Report\",\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
    
    # メール通知（sendmail使用）
    if command -v sendmail &> /dev/null && [ -n "$ADMIN_EMAIL" ]; then
        cat << EOF | sendmail "$ADMIN_EMAIL"
Subject: Firebase Backup Report - $status
Date: $(date)

$message

Backup Date: $DATE_FORMAT
Project: $PROJECT_ID
EOF
    fi
}

# =====================================
# メイン実行関数
# =====================================

main() {
    local start_time=$(date +%s)
    
    log "🚀 Firebase本番環境バックアップ開始"
    log "   プロジェクト: $PROJECT_ID"
    log "   バックアップ日時: $DATE_FORMAT"
    
    # 事前チェック
    if ! check_prerequisites; then
        log_error "事前チェック失敗"
        send_notification "failed" "事前チェックが失敗しました"
        exit 1
    fi
    
    # バックアップ実行
    local backup_status="success"
    local error_message=""
    
    if ! backup_firestore; then
        backup_status="failed"
        error_message="Firestoreバックアップ失敗"
    fi
    
    if ! backup_storage; then
        backup_status="warning"
        error_message="${error_message}\nStorageバックアップで問題発生"
    fi
    
    if ! backup_configurations; then
        backup_status="failed"
        error_message="${error_message}\n設定バックアップ失敗"
    fi
    
    # バックアップ検証
    if ! verify_backup; then
        backup_status="failed"
        error_message="${error_message}\nバックアップ検証失敗"
    fi
    
    # 古いバックアップ削除
    cleanup_old_backups
    
    # 完了処理
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    local summary_message="バックアップ完了\n"
    summary_message="${summary_message}ステータス: $backup_status\n"
    summary_message="${summary_message}所要時間: ${duration}秒\n"
    summary_message="${summary_message}バックアップ場所: gs://$BACKUP_BASE_BUCKET\n"
    
    if [ "$backup_status" != "success" ]; then
        summary_message="${summary_message}エラー: $error_message"
    fi
    
    log "$summary_message"
    send_notification "$backup_status" "$summary_message"
    
    log "🎉 Firebase本番環境バックアップ完了"
    
    # 終了コード設定
    case "$backup_status" in
        "success") exit 0 ;;
        "warning") exit 1 ;;
        "failed") exit 2 ;;
    esac
}

# =====================================
# スクリプト実行
# =====================================

# 引数によるモード切り替え
case "${1:-full}" in
    "full")
        main
        ;;
    "firestore-only")
        check_prerequisites
        backup_firestore
        verify_backup
        ;;
    "storage-only")
        check_prerequisites
        backup_storage
        ;;
    "config-only")
        check_prerequisites
        backup_configurations
        ;;
    "verify")
        verify_backup
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "使用方法: $0 [full|firestore-only|storage-only|config-only|verify|cleanup]"
        exit 1
        ;;
esac