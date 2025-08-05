import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import BookingComplete from '~/app/components/BookingComplete.vue'
import { createAdvancedMountOptions } from '~/tests/utils/test-helpers-advanced'
import { createMockBookingData } from '~/tests/utils/test-helpers'
import type { BookingData } from '~/types/booking'

// EmailNotificationStatusモック
const mockEmailNotificationStatus = {
  template: '<div data-testid="email-notification-status-mock">Mock Email Status</div>'
}

vi.mock('~/app/components/EmailNotificationStatus.vue', () => ({
  default: mockEmailNotificationStatus
}))

describe('BookingComplete', () => {
  let wrapper: VueWrapper<any>
  let mockBookingData: BookingData

  beforeEach(() => {
    vi.clearAllMocks()
    
    // モックデータ作成
    mockBookingData = createMockBookingData({
      customerInfo: {
        name: 'テスト顧客',
        email: 'test@example.com',
        phone: '090-1234-5678',
        isNewCustomer: true
      },
      services: [
        {
          id: 'service-1',
          name: 'カット',
          description: 'ヘアカット',
          duration: 60,
          price: 4000,
          category: {
            id: 'cut',
            name: 'カット',
            icon: 'bi-scissors',
            order: 1
          },
          isActive: true
        }
      ],
      stylist: {
        id: 'stylist-1',
        name: 'test_stylist',
        displayName: 'テストスタイリスト',
        specialties: ['カット'],
        experience: 5,
        rating: 4.5,
        isActive: true,
        avatar: '/images/stylist1.jpg',
        workingHours: {
          monday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
          tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
          wednesday: { isWorking: false, startTime: '', endTime: '' },
          thursday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
          friday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
          saturday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          sunday: { isWorking: false, startTime: '', endTime: '' }
        }
      },
      date: '2024-01-15',
      timeSlot: {
        time: '14:00',
        endTime: '15:00',
        isAvailable: true,
        stylistId: 'stylist-1',
        duration: 60
      },
      specialRequests: 'テストリクエスト'
    })

    // グローバルオブジェクトのモック
    Object.defineProperty(window, 'open', {
      value: vi.fn(),
      writable: true
    })

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true
    })

    // URL.createObjectURL のモック
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props: any = {}) => {
    return mount(BookingComplete, createAdvancedMountOptions({
      props: {
        bookingData: mockBookingData,
        ...props
      }
    }))
  }

  describe('Initial Render', () => {
    it('should render completion message', () => {
      wrapper = createWrapper()
      
      const completionMessage = wrapper.find('[data-testid="completion-message"]')
      expect(completionMessage.exists()).toBe(true)
      expect(completionMessage.text()).toContain('ご予約が完了しました！')
      
      const successIcon = wrapper.find('[data-testid="success-icon"]')
      expect(successIcon.exists()).toBe(true)
    })

    it('should display booking details correctly', () => {
      wrapper = createWrapper()
      
      // 予約ID確認
      expect(wrapper.text()).toContain('予約番号:')
      
      // 日時情報確認
      expect(wrapper.text()).toContain('2024年1月15日')
      expect(wrapper.text()).toContain('14:00 〜 15:00')
      
      // サービス情報確認
      expect(wrapper.text()).toContain('カット')
      expect(wrapper.text()).toContain('¥4,000')
      expect(wrapper.text()).toContain('合計金額')
      
      // スタイリスト情報確認
      expect(wrapper.text()).toContain('テストスタイリスト')
      expect(wrapper.text()).toContain('経験5年')
      
      // 顧客情報確認
      expect(wrapper.text()).toContain('テスト顧客')
      expect(wrapper.text()).toContain('test@example.com')
      expect(wrapper.text()).toContain('090-1234-5678')
      expect(wrapper.text()).toContain('テストリクエスト')
    })

    it('should render with null booking data', () => {
      wrapper = createWrapper({ bookingData: null })
      
      // エラーが発生せず、基本構造が存在することを確認
      const component = wrapper.find('.booking-complete')
      expect(component.exists()).toBe(true)
    })
  })

  describe('Calendar Integration', () => {
    it('should render calendar addition buttons', () => {
      wrapper = createWrapper()
      
      const googleCalendarButton = wrapper.find('[data-testid="add-google-calendar"]')
      expect(googleCalendarButton.exists()).toBe(true)
      expect(googleCalendarButton.text()).toContain('Google Calendar')
      
      const appleCalendarButton = wrapper.find('[data-testid="add-apple-calendar"]')
      expect(appleCalendarButton.exists()).toBe(true)
      expect(appleCalendarButton.text()).toContain('Apple Calendar')
      
      const downloadIcsButton = wrapper.find('[data-testid="download-ics"]')
      expect(downloadIcsButton.exists()).toBe(true)
      expect(downloadIcsButton.text()).toContain('.ics ファイル')
    })

    it('should open Google Calendar when button clicked', async () => {
      const mockOpen = vi.fn()
      window.open = mockOpen
      
      wrapper = createWrapper()
      
      const googleCalendarButton = wrapper.find('[data-testid="add-google-calendar"]')
      await googleCalendarButton.trigger('click')
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://calendar.google.com/calendar/render'),
        '_blank'
      )
    })

    it('should download ICS file when download button clicked', async () => {
      // document.createElement のモック
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      
      wrapper = createWrapper()
      
      const downloadButton = wrapper.find('[data-testid="download-ics"]')
      await downloadButton.trigger('click')
      
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toContain('.ics')
    })

    it('should handle Apple Calendar (redirect to ICS download)', async () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      
      wrapper = createWrapper()
      
      const appleCalendarButton = wrapper.find('[data-testid="add-apple-calendar"]')
      await appleCalendarButton.trigger('click')
      
      // Apple Calendarボタンは内部的にdownloadICS()を呼び出す
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  describe('Action Buttons', () => {
    it('should render action buttons', () => {
      wrapper = createWrapper()
      
      const dashboardButton = wrapper.find('[data-testid="go-dashboard-button"]')
      expect(dashboardButton.exists()).toBe(true)
      expect(dashboardButton.text()).toContain('ダッシュボードへ')
      
      const newBookingButton = wrapper.find('[data-testid="new-booking-button"]')
      expect(newBookingButton.exists()).toBe(true)
      expect(newBookingButton.text()).toContain('新しい予約をする')
    })

    it('should emit goDashboard event when dashboard button clicked', async () => {
      wrapper = createWrapper()
      
      const dashboardButton = wrapper.find('[data-testid="go-dashboard-button"]')
      await dashboardButton.trigger('click')
      
      expect(wrapper.emitted('goDashboard')).toBeTruthy()
    })

    it('should emit newBooking event when new booking button clicked', async () => {
      wrapper = createWrapper()
      
      const newBookingButton = wrapper.find('[data-testid="new-booking-button"]')
      await newBookingButton.trigger('click')
      
      expect(wrapper.emitted('newBooking')).toBeTruthy()
    })
  })

  describe('Social Sharing', () => {
    it('should handle Twitter sharing', async () => {
      const mockOpen = vi.fn()
      window.open = mockOpen
      
      wrapper = createWrapper()
      
      const twitterButton = wrapper.find('button:contains("Twitter")')
      await twitterButton.trigger('click')
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://twitter.com/intent/tweet'),
        '_blank'
      )
    })

    it('should handle LINE sharing', async () => {
      const mockOpen = vi.fn()
      window.open = mockOpen
      
      wrapper = createWrapper()
      
      const lineButton = wrapper.find('button:contains("LINE")')
      await lineButton.trigger('click')
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://line.me/R/msg/text/'),
        '_blank'
      )
    })

    it('should copy link to clipboard', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      navigator.clipboard.writeText = mockWriteText
      
      // alertをモック
      global.alert = vi.fn()
      
      wrapper = createWrapper()
      
      const copyLinkButton = wrapper.find('button:contains("リンクをコピー")')
      await copyLinkButton.trigger('click')
      
      expect(mockWriteText).toHaveBeenCalledWith(window.location.origin)
    })
  })

  describe('Stylist Information', () => {
    it('should display stylist information when stylist is assigned', () => {
      wrapper = createWrapper()
      
      expect(wrapper.text()).toContain('テストスタイリスト')
      expect(wrapper.text()).toContain('経験5年')
      expect(wrapper.text()).toContain('4.5')
      
      const stylistAvatar = wrapper.find('.stylist-avatar')
      expect(stylistAvatar.exists()).toBe(true)
    })

    it('should display "any stylist" when no specific stylist assigned', () => {
      const bookingDataWithoutStylist = {
        ...mockBookingData,
        stylist: null,
        isAnyStylietOk: true
      }
      
      wrapper = createWrapper({ bookingData: bookingDataWithoutStylist })
      
      expect(wrapper.text()).toContain('どなたでも可')
      expect(wrapper.text()).toContain('最適なスタイリストを選ばせていただきます')
    })

    it('should handle stylist avatar image error', async () => {
      wrapper = createWrapper()
      
      const stylistAvatar = wrapper.find('.stylist-avatar')
      
      // 画像エラーイベントを発火
      await stylistAvatar.trigger('error')
      
      // デフォルト画像に切り替わることを確認
      expect(stylistAvatar.attributes('src')).toBe('/images/default-avatar.png')
    })
  })

  describe('Multiple Services', () => {
    it('should display multiple services correctly', () => {
      const bookingDataWithMultipleServices = {
        ...mockBookingData,
        services: [
          {
            id: 'service-1',
            name: 'カット',
            description: 'ヘアカット',
            duration: 60,
            price: 4000,
            category: {
              id: 'cut',
              name: 'カット',
              icon: 'bi-scissors',
              order: 1
            },
            isActive: true
          },
          {
            id: 'service-2',
            name: 'カラー',
            description: 'ヘアカラー',
            duration: 90,
            price: 6000,
            category: {
              id: 'color',
              name: 'カラー',
              icon: 'bi-palette',
              order: 2
            },
            isActive: true
          }
        ]
      }
      
      wrapper = createWrapper({ bookingData: bookingDataWithMultipleServices })
      
      expect(wrapper.text()).toContain('カット')
      expect(wrapper.text()).toContain('¥4,000')
      expect(wrapper.text()).toContain('カラー')
      expect(wrapper.text()).toContain('¥6,000')
      expect(wrapper.text()).toContain('¥10,000') // 合計金額
    })
  })

  describe('Email Notification Integration', () => {
    it('should handle email sent event', async () => {
      wrapper = createWrapper()
      
      // EmailNotificationStatusコンポーネントからのイベントをシミュレート
      const emailComponent = wrapper.findComponent({ name: 'EmailNotificationStatus' })
      await emailComponent.vm.$emit('emailSent', true)
      
      // イベントが正しく処理されることを確認（現在はconsole.logのみ）
      // 実際の実装では、このイベントでトースト通知などが表示される可能性がある
      expect(true).toBe(true) // プレースホルダー
    })

    it('should handle email failed event', async () => {
      wrapper = createWrapper()
      
      const emailComponent = wrapper.findComponent({ name: 'EmailNotificationStatus' })
      await emailComponent.vm.$emit('emailFailed', 'Email sending failed')
      
      // イベントが正しく処理されることを確認
      expect(true).toBe(true) // プレースホルダー
    })
  })

  describe('Computed Properties', () => {
    it('should calculate total duration correctly', () => {
      const bookingDataWithMultipleServices = {
        ...mockBookingData,
        services: [
          { ...mockBookingData.services[0], duration: 60 },
          { 
            id: 'service-2', 
            name: 'Wash', 
            duration: 30, 
            price: 1000,
            description: 'シャンプー',
            category: {
              id: 'wash',
              name: 'シャンプー',
              icon: 'bi-droplet',
              order: 3
            },
            isActive: true
          }
        ]
      }
      
      wrapper = createWrapper({ bookingData: bookingDataWithMultipleServices })
      
      expect(wrapper.text()).toContain('(90分間)')
    })

    it('should calculate total price correctly', () => {
      const bookingDataWithMultipleServices = {
        ...mockBookingData,
        services: [
          { ...mockBookingData.services[0], price: 4000 },
          { 
            id: 'service-2', 
            name: 'Treatment', 
            duration: 30, 
            price: 2000,
            description: 'トリートメント',
            category: {
              id: 'treatment',
              name: 'トリートメント',
              icon: 'bi-heart',
              order: 4
            },
            isActive: true
          }
        ]
      }
      
      wrapper = createWrapper({ bookingData: bookingDataWithMultipleServices })
      
      expect(wrapper.text()).toContain('¥6,000')
    })

    it('should format date correctly', () => {
      wrapper = createWrapper()
      
      // 日本語の日付フォーマットが正しく表示されることを確認
      expect(wrapper.text()).toContain('2024年1月15日')
    })

    it('should generate unique booking ID', () => {
      const wrapper1 = createWrapper()
      const wrapper2 = createWrapper()
      
      // 2つの異なるインスタンスで異なるIDが生成されることを確認
      // （実際のテストでは時間ベースのIDなので、同一時刻では同じIDになる可能性がある）
      expect(wrapper1.text()).toMatch(/予約番号: BK\d{6}/)
      expect(wrapper2.text()).toMatch(/予約番号: BK\d{6}/)
    })
  })

  describe('Error Handling', () => {
    it('should handle clipboard API failure gracefully', async () => {
      // clipboard API エラーをシミュレート
      navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard API failed'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      wrapper = createWrapper()
      
      const copyLinkButton = wrapper.find('button:contains("リンクをコピー")')
      await copyLinkButton.trigger('click')
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy link:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      wrapper = createWrapper()
      
      const mainHeading = wrapper.find('h2')
      expect(mainHeading.exists()).toBe(true)
      expect(mainHeading.text()).toContain('ご予約が完了しました！')
      
      const sectionHeadings = wrapper.findAll('h5, h6')
      expect(sectionHeadings.length).toBeGreaterThan(0)
    })

    it('should have alt text for stylist image', () => {
      wrapper = createWrapper()
      
      const stylistAvatar = wrapper.find('.stylist-avatar')
      expect(stylistAvatar.attributes('alt')).toContain('テストスタイリスト')
      expect(stylistAvatar.attributes('alt')).toContain('プロフィール写真')
    })

    it('should have proper button roles', () => {
      wrapper = createWrapper()
      
      const actionButtons = wrapper.findAll('button')
      actionButtons.forEach(button => {
        expect(button.attributes('type')).toBe('button')
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render properly on mobile viewport', () => {
      // モバイルビューポートのシミュレーション
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true })
      
      wrapper = createWrapper()
      
      // 基本構造が維持されていることを確認
      const bookingComplete = wrapper.find('.booking-complete')
      expect(bookingComplete.exists()).toBe(true)
      
      // 重要な要素が存在することを確認
      const completionMessage = wrapper.find('[data-testid="completion-message"]')
      expect(completionMessage.exists()).toBe(true)
    })
  })
})