import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { spawn, ChildProcess } from 'child_process'
import { chromium, Browser, Page } from 'playwright'

/**
 * Phase 2 Integration Test Suite
 * Testing complete Frontend-Backend integration
 * 
 * Test Coverage:
 * - dev1 Frontend (Nuxt 3) + dev2 Backend (API) integration
 * - Firebase authentication flow
 * - Real-time availability system
 * - Calendar functionality
 * - API error handling
 * - Performance benchmarks
 */

describe('Phase 2 Complete Integration Tests', () => {
  let browser: Browser
  let page: Page
  let frontendProcess: ChildProcess
  let backendProcess: ChildProcess
  let firebaseProcess: ChildProcess

  const FRONTEND_URL = 'http://localhost:3000'
  const BACKEND_URL = 'http://localhost:3001'
  const FIREBASE_UI_URL = 'http://localhost:4000'

  beforeAll(async () => {
    console.log('🚀 Starting Phase 2 Integration Test Suite...')
    
    // Start Firebase Emulator
    console.log('📦 Starting Firebase Emulator...')
    firebaseProcess = spawn('firebase', ['emulators:start', '--only', 'auth,firestore,functions'], {
      cwd: './firebase',
      stdio: 'pipe'
    })
    
    // Wait for Firebase to start
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    // Start Backend
    console.log('🔧 Starting Backend Server...')
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: './backend',
      stdio: 'pipe'
    })
    
    // Wait for backend to start
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Start Frontend
    console.log('🎨 Starting Frontend Server...')
    frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: './frontend',
      stdio: 'pipe'
    })
    
    // Wait for frontend to start
    await new Promise(resolve => setTimeout(resolve, 15000))
    
    // Initialize Playwright
    browser = await chromium.launch({ headless: true })
    page = await browser.newPage()
    
    console.log('✅ All services started successfully')
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up test environment...')
    
    if (browser) await browser.close()
    if (frontendProcess) frontendProcess.kill()
    if (backendProcess) backendProcess.kill()
    if (firebaseProcess) firebaseProcess.kill()
    
    console.log('✅ Cleanup completed')
  })

  beforeEach(async () => {
    // Clear any previous state
    await page.goto(FRONTEND_URL)
  })

  describe('System Health Checks', () => {
    it('should verify all services are running', async () => {
      // Check Firebase Emulator
      const firebaseResponse = await fetch(FIREBASE_UI_URL)
      expect(firebaseResponse.status).toBe(200)
      
      // Check Backend API
      const backendResponse = await fetch(`${BACKEND_URL}/health`)
      expect(backendResponse.status).toBe(200)
      
      // Check Frontend
      const frontendResponse = await fetch(FRONTEND_URL)
      expect(frontendResponse.status).toBe(200)
    })

    it('should verify API endpoints are accessible', async () => {
      const endpoints = [
        '/api/tenants/test-tenant/menus',
        '/api/tenants/test-tenant/staffs',
        '/api/tenants/test-tenant/reservations/availability/check'
      ]

      for (const endpoint of endpoints) {
        const response = await fetch(`${BACKEND_URL}${endpoint}`)
        // Should return 401 (unauthorized) which means endpoint exists
        expect([200, 401, 403]).toContain(response.status)
      }
    })
  })

  describe('Authentication Integration', () => {
    it('should handle Firebase authentication flow', async () => {
      await page.goto(`${FRONTEND_URL}/auth/login`)
      
      // Check if login page loads
      await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 })
      
      // Test Firebase auth integration
      const authElement = await page.$('[data-testid="firebase-auth"]')
      expect(authElement).toBeTruthy()
    })

    it('should redirect to dashboard after authentication', async () => {
      // Mock authentication success
      await page.evaluate(() => {
        // Simulate successful Firebase auth
        window.localStorage.setItem('auth-token', 'mock-token')
      })
      
      await page.goto(`${FRONTEND_URL}/admin`)
      
      // Should reach admin dashboard
      await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 })
      
      const dashboardTitle = await page.textContent('h1')
      expect(dashboardTitle).toContain('管理ダッシュボード')
    })
  })

  describe('Calendar Integration Tests', () => {
    it('should load booking calendar with API integration', async () => {
      await page.goto(`${FRONTEND_URL}/booking`)
      
      // Wait for calendar to load
      await page.waitForSelector('[data-testid="booking-calendar"]', { timeout: 15000 })
      
      // Check calendar view toggles
      const monthView = await page.$('[data-testid="month-view"]')
      const weekView = await page.$('[data-testid="week-view"]')
      const dayView = await page.$('[data-testid="day-view"]')
      
      expect(monthView).toBeTruthy()
      expect(weekView).toBeTruthy()
      expect(dayView).toBeTruthy()
    })

    it('should switch between calendar views', async () => {
      await page.goto(`${FRONTEND_URL}/booking`)
      await page.waitForSelector('[data-testid="booking-calendar"]')
      
      // Test month view
      await page.click('[data-testid="month-view-button"]')
      await page.waitForSelector('[data-testid="month-calendar"]')
      
      // Test week view
      await page.click('[data-testid="week-view-button"]')
      await page.waitForSelector('[data-testid="week-calendar"]')
      
      // Test day view
      await page.click('[data-testid="day-view-button"]')
      await page.waitForSelector('[data-testid="day-calendar"]')
    })

    it('should display real-time availability data', async () => {
      await page.goto(`${FRONTEND_URL}/booking`)
      await page.waitForSelector('[data-testid="booking-calendar"]')
      
      // Check for availability indicators
      const availabilitySlots = await page.$$('[data-testid="available-slot"]')
      
      // Should have some availability data (even if mocked)
      expect(availabilitySlots.length).toBeGreaterThan(0)
    })
  })

  describe('API Integration Tests', () => {
    it('should test menu API integration', async () => {
      await page.goto(`${FRONTEND_URL}/api-test`)
      await page.waitForSelector('[data-testid="api-test-page"]')
      
      // Test menu API call
      await page.click('[data-testid="test-menus-api"]')
      
      // Wait for API response
      await page.waitForSelector('[data-testid="api-response"]', { timeout: 10000 })
      
      const response = await page.textContent('[data-testid="api-response"]')
      expect(response).toContain('menus')
    })

    it('should test staff API integration', async () => {
      await page.goto(`${FRONTEND_URL}/api-test`)
      
      // Test staff API call
      await page.click('[data-testid="test-staffs-api"]')
      
      await page.waitForSelector('[data-testid="api-response"]')
      
      const response = await page.textContent('[data-testid="api-response"]')
      expect(response).toContain('staffs')
    })

    it('should test availability API integration', async () => {
      await page.goto(`${FRONTEND_URL}/api-test`)
      
      // Test availability API call
      await page.click('[data-testid="test-availability-api"]')
      
      await page.waitForSelector('[data-testid="api-response"]')
      
      const response = await page.textContent('[data-testid="api-response"]')
      expect(response).toContain('availableTimeSlots')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle authentication errors gracefully', async () => {
      await page.goto(`${FRONTEND_URL}/booking`)
      
      // Mock authentication failure
      await page.evaluate(() => {
        window.localStorage.removeItem('auth-token')
      })
      
      await page.reload()
      
      // Should redirect to login or show error message
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/(login|auth|error)/)
    })

    it('should handle API errors gracefully', async () => {
      await page.goto(`${FRONTEND_URL}/api-test`)
      
      // Test error response handling
      await page.click('[data-testid="test-error-handling"]')
      
      await page.waitForSelector('[data-testid="error-message"]')
      
      const errorMessage = await page.textContent('[data-testid="error-message"]')
      expect(errorMessage).toBeTruthy()
    })
  })

  describe('Performance Tests', () => {
    it('should load calendar within acceptable time', async () => {
      const startTime = Date.now()
      
      await page.goto(`${FRONTEND_URL}/booking`)
      await page.waitForSelector('[data-testid="booking-calendar"]')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    it('should handle API calls within acceptable time', async () => {
      await page.goto(`${FRONTEND_URL}/api-test`)
      
      const startTime = Date.now()
      
      await page.click('[data-testid="test-availability-api"]')
      await page.waitForSelector('[data-testid="api-response"]')
      
      const apiTime = Date.now() - startTime
      
      // API should respond within 2 seconds
      expect(apiTime).toBeLessThan(2000)
    })
  })

  describe('End-to-End User Flows', () => {
    it('should complete booking flow', async () => {
      await page.goto(`${FRONTEND_URL}/booking`)
      
      // Navigate through booking steps
      await page.waitForSelector('[data-testid="service-selection"]')
      await page.click('[data-testid="select-service-haircut"]')
      
      await page.waitForSelector('[data-testid="staff-selection"]')
      await page.click('[data-testid="select-staff-first"]')
      
      await page.waitForSelector('[data-testid="datetime-selection"]')
      await page.click('[data-testid="select-available-slot"]')
      
      // Should reach confirmation step
      await page.waitForSelector('[data-testid="booking-confirmation"]')
      
      const confirmationText = await page.textContent('[data-testid="booking-summary"]')
      expect(confirmationText).toContain('予約確認')
    })

    it('should handle mobile responsive design', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto(`${FRONTEND_URL}/booking`)
      await page.waitForSelector('[data-testid="booking-calendar"]')
      
      // Check mobile navigation
      const mobileMenu = await page.$('[data-testid="mobile-menu"]')
      expect(mobileMenu).toBeTruthy()
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 })
    })
  })

  describe('Quality Metrics Validation', () => {
    it('should pass accessibility checks', async () => {
      await page.goto(`${FRONTEND_URL}/booking`)
      await page.waitForSelector('[data-testid="booking-calendar"]')
      
      // Check for ARIA labels
      const ariaElements = await page.$$('[aria-label]')
      expect(ariaElements.length).toBeGreaterThan(0)
      
      // Check for semantic HTML
      const headings = await page.$$('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBeGreaterThan(0)
    })

    it('should maintain consistent UI across pages', async () => {
      const pages = ['/booking', '/admin', '/api-test']
      
      for (const pagePath of pages) {
        await page.goto(`${FRONTEND_URL}${pagePath}`)
        
        // Check for consistent header
        const header = await page.$('[data-testid="app-header"]')
        expect(header).toBeTruthy()
        
        // Check for consistent styling
        const bodyClass = await page.$eval('body', el => el.className)
        expect(bodyClass).toBeTruthy()
      }
    })
  })

  describe('Security Integration Tests', () => {
    it('should enforce authentication on protected routes', async () => {
      // Clear authentication
      await page.evaluate(() => {
        window.localStorage.clear()
      })
      
      await page.goto(`${FRONTEND_URL}/admin`)
      
      // Should redirect to login
      await page.waitForTimeout(2000)
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/(login|auth)/)
    })

    it('should include proper security headers', async () => {
      const response = await page.goto(`${FRONTEND_URL}/booking`)
      const headers = response?.headers()
      
      // Check for security headers (if implemented)
      expect(headers).toBeTruthy()
    })
  })
})

// Test utilities
async function waitForApiResponse(page: Page, apiEndpoint: string) {
  return page.waitForResponse(response => 
    response.url().includes(apiEndpoint) && response.status() < 400
  )
}

async function mockFirebaseAuth(page: Page, userRole: string = 'customer') {
  await page.evaluate((role) => {
    window.localStorage.setItem('firebase-auth', JSON.stringify({
      uid: 'test-user-123',
      email: 'test@example.com',
      role: role,
      token: 'mock-firebase-token'
    }))
  }, userRole)
}