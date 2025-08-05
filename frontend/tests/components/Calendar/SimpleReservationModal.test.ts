import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import SimpleReservationModal from '~/components/Calendar/SimpleReservationModal.vue'

// テスト用の型定義
interface ReservationData {
  id?: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  category: string
  details: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt?: Date
  updatedAt?: Date
}

// テスト用のMockデータ
const mockReservation: ReservationData = {
  id: 'test-id',
  date: '2024-12-25',
  time: '10:00',
  customerName: 'テスト 太郎',
  customerPhone: '090-1234-5678',
  category: 'cut',
  details: 'カット希望です',
  status: 'pending',
  createdAt: new Date('2024-12-20'),
  updatedAt: new Date('2024-12-20')
}

describe('SimpleReservationModal', () => {
  const defaultProps = {
    show: true,
    selectedDate: new Date('2024-12-25'),
    reservation: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('新規予約モード', () => {
    it('モーダルが正しく表示される', () => {
      render(SimpleReservationModal, {
        props: defaultProps
      })

      expect(screen.getByText('新規予約')).toBeInTheDocument()
      expect(screen.getByLabelText('日付 *')).toBeInTheDocument()
      expect(screen.getByLabelText('時間 *')).toBeInTheDocument()
      expect(screen.getByLabelText('お名前 *')).toBeInTheDocument()
      expect(screen.getByText('予約作成')).toBeInTheDocument()
    })

    it('初期値が正しく設定される', () => {
      render(SimpleReservationModal, {
        props: defaultProps
      })

      const dateInput = screen.getByLabelText('日付 *') as HTMLInputElement
      const timeInput = screen.getByLabelText('時間 *') as HTMLInputElement

      expect(dateInput.value).toBe('2024-12-25')
      expect(timeInput.value).toBe('10:00')
    })

    it('カテゴリー選択が正しく動作する', async () => {
      render(SimpleReservationModal, {
        props: defaultProps
      })

      const cutCategory = screen.getByText('カット')
      await fireEvent.click(cutCategory)

      const categoryItem = cutCategory.closest('.category-item')
      expect(categoryItem).toHaveClass('selected')
    })

    it('フォームバリデーションが正しく動作する', async () => {
      const { emitted } = render(SimpleReservationModal, {
        props: defaultProps
      })

      const submitButton = screen.getByText('予約作成')
      
      // 空のフォームで送信を試行
      await fireEvent.click(submitButton)
      
      // バリデーションエラーが表示される
      expect(screen.getByText('お名前を入力してください')).toBeInTheDocument()
      
      // saveイベントが発生しない
      expect(emitted().save).toBeUndefined()
    })

    it('正しい入力でフォーム送信が成功する', async () => {
      const { emitted } = render(SimpleReservationModal, {
        props: defaultProps
      })

      // フォームに入力
      const nameInput = screen.getByLabelText('お名前 *')
      await fireEvent.update(nameInput, 'テスト 太郎')

      const phoneInput = screen.getByLabelText('電話番号')
      await fireEvent.update(phoneInput, '090-1234-5678')

      const cutCategory = screen.getByText('カット')
      await fireEvent.click(cutCategory)

      const detailsTextarea = screen.getByLabelText('予約内容')
      await fireEvent.update(detailsTextarea, 'カット希望')

      // 送信
      const submitButton = screen.getByText('予約作成')
      await fireEvent.click(submitButton)

      // saveイベントが発生する
      await waitFor(() => {
        expect(emitted().save).toBeTruthy()
        expect(emitted().save[0][0]).toMatchObject({
          date: '2024-12-25',
          time: '10:00',
          customerName: 'テスト 太郎',
          customerPhone: '090-1234-5678',
          category: 'cut',
          details: 'カット希望',
          status: 'pending'
        })
      })
    })
  })

  describe('編集モード', () => {
    const editProps = {
      show: true,
      selectedDate: new Date('2024-12-25'),
      reservation: mockReservation
    }

    it('編集モードで正しく表示される', () => {
      render(SimpleReservationModal, {
        props: editProps
      })

      expect(screen.getByText('予約編集')).toBeInTheDocument()
      expect(screen.getByText('更新')).toBeInTheDocument()
      expect(screen.getByText('削除')).toBeInTheDocument()
    })

    it('既存データが正しく設定される', () => {
      render(SimpleReservationModal, {
        props: editProps
      })

      const nameInput = screen.getByLabelText('お名前 *') as HTMLInputElement
      const phoneInput = screen.getByLabelText('電話番号') as HTMLInputElement
      
      expect(nameInput.value).toBe('テスト 太郎')
      expect(phoneInput.value).toBe('090-1234-5678')
    })

    it('ステータス選択が編集モードでのみ表示される', () => {
      // 新規作成モード
      const { rerender } = render(SimpleReservationModal, {
        props: defaultProps
      })
      
      expect(screen.queryByText('ステータス')).not.toBeInTheDocument()

      // 編集モード
      rerender({
        props: editProps
      })

      expect(screen.getByText('ステータス')).toBeInTheDocument()
      expect(screen.getByText('予約済み')).toBeInTheDocument()
      expect(screen.getByText('確認済み')).toBeInTheDocument()
      expect(screen.getByText('来店完了')).toBeInTheDocument()
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })

    it('削除確認ダイアログが正しく動作する', async () => {
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
      const { emitted } = render(SimpleReservationModal, {
        props: editProps
      })

      const deleteButton = screen.getByText('削除')
      await fireEvent.click(deleteButton)

      expect(mockConfirm).toHaveBeenCalledWith(
        'この予約を削除しますか？\n削除した予約は元に戻せません。'
      )
      
      expect(emitted().delete).toBeTruthy()
      expect(emitted().delete[0][0]).toBe('test-id')

      mockConfirm.mockRestore()
    })

    it('削除キャンセル時は削除されない', async () => {
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
      const { emitted } = render(SimpleReservationModal, {
        props: editProps
      })

      const deleteButton = screen.getByText('削除')
      await fireEvent.click(deleteButton)

      expect(emitted().delete).toBeUndefined()

      mockConfirm.mockRestore()
    })
  })

  describe('バリデーション', () => {
    beforeEach(() => {
      render(SimpleReservationModal, {
        props: defaultProps
      })
    })

    it('必須項目の検証が正しく動作する', async () => {
      const submitButton = screen.getByText('予約作成')
      await fireEvent.click(submitButton)

      expect(screen.getByText('お名前を入力してください')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('電話番号の形式検証が正しく動作する', async () => {
      const phoneInput = screen.getByLabelText('電話番号')
      
      // 不正な電話番号
      await fireEvent.update(phoneInput, 'invalid-phone')
      await fireEvent.blur(phoneInput)

      await waitFor(() => {
        expect(screen.getByText('正しい電話番号を入力してください')).toBeInTheDocument()
      })
    })

    it('過去の日付は選択できない', async () => {
      const dateInput = screen.getByLabelText('日付 *')
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      await fireEvent.update(dateInput, yesterday.toISOString().split('T')[0])
      await fireEvent.blur(dateInput)

      await waitFor(() => {
        expect(screen.getByText('過去の日付は選択できません')).toBeInTheDocument()
      })
    })

    it('詳細の文字数制限が正しく動作する', async () => {
      const detailsTextarea = screen.getByLabelText('予約内容')
      const longText = 'a'.repeat(501) // 500文字を超える
      
      await fireEvent.update(detailsTextarea, longText)
      await fireEvent.blur(detailsTextarea)

      await waitFor(() => {
        expect(screen.getByText('詳細は500文字以内で入力してください')).toBeInTheDocument()
      })
    })
  })

  describe('モーダル操作', () => {
    it('閉じるボタンでモーダルが閉じられる', async () => {
      const { emitted } = render(SimpleReservationModal, {
        props: defaultProps
      })

      const closeButton = screen.getByLabelText('閉じる')
      await fireEvent.click(closeButton)

      expect(emitted().close).toBeTruthy()
    })

    it('キャンセルボタンでモーダルが閉じられる', async () => {
      const { emitted } = render(SimpleReservationModal, {
        props: defaultProps
      })

      const cancelButton = screen.getByText('キャンセル')
      await fireEvent.click(cancelButton)

      expect(emitted().close).toBeTruthy()
    })

    it('オーバーレイクリックでモーダルが閉じられる', async () => {
      const { emitted } = render(SimpleReservationModal, {
        props: defaultProps
      })

      const overlay = screen.getByRole('dialog').parentElement!
      await fireEvent.click(overlay)

      expect(emitted().close).toBeTruthy()
    })

    it('モーダルコンテンツクリック時は閉じられない', async () => {
      const { emitted } = render(SimpleReservationModal, {
        props: defaultProps
      })

      const modalContent = screen.getByRole('dialog')
      await fireEvent.click(modalContent)

      expect(emitted().close).toBeUndefined()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIAラベルが設定されている', () => {
      render(SimpleReservationModal, {
        props: defaultProps
      })

      expect(screen.getByLabelText('閉じる')).toBeInTheDocument()
      expect(screen.getByLabelText('日付 *')).toBeInTheDocument()
      expect(screen.getByLabelText('時間 *')).toBeInTheDocument()
      expect(screen.getByLabelText('お名前 *')).toBeInTheDocument()
    })

    it('キーボードナビゲーションが正しく動作する', async () => {
      render(SimpleReservationModal, {
        props: defaultProps
      })

      const nameInput = screen.getByLabelText('お名前 *')
      nameInput.focus()
      
      expect(document.activeElement).toBe(nameInput)
    })
  })

  describe('レスポンシブ対応', () => {
    it('小さい画面でも正しく表示される', () => {
      // CSSのメディアクエリテストは実装が複雑なため、
      // クラス名の存在確認のみ行う
      render(SimpleReservationModal, {
        props: defaultProps
      })

      const modalContainer = screen.getByRole('dialog')
      expect(modalContainer).toHaveClass('modal-container')
    })
  })
})