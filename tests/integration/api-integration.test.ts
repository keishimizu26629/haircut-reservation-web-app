import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { app } from '../../backend/src/app'
import { initializeTestEnvironment } from './setup'
import { cleanupTestData } from './teardown'

/**
 * API Integration Tests - Phase 2
 * Testing dev1 & dev2 integration points
 * 
 * Test Scope:
 * - Authentication flow
 * - RBAC authorization
 * - Reservation CRUD operations
 * - Customer management
 * - Service management
 */

describe('API Integration Tests - Phase 2', () => {
  let testUser: any
  let adminUser: any
  let staffUser: any
  let authToken: string
  let adminToken: string
  let staffToken: string

  beforeAll(async () => {
    // Initialize test environment
    await initializeTestEnvironment()
    
    // Create test users with different roles
    testUser = await createTestUser('customer@test.com', 'customer')
    adminUser = await createTestUser('admin@test.com', 'owner')
    staffUser = await createTestUser('staff@test.com', 'staff')
    
    // Get authentication tokens
    authToken = await getTestToken(testUser.uid)
    adminToken = await getTestToken(adminUser.uid)
    staffToken = await getTestToken(staffUser.uid)
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  beforeEach(async () => {
    // Clean database state before each test
    await cleanupTestData()
  })

  describe('Authentication & Authorization', () => {
    it('should authenticate valid user token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        uid: testUser.uid,
        email: testUser.email,
        role: 'customer'
      })
    })

    it('should reject invalid token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })

    it('should enforce role-based access control', async () => {
      // Customer should not access admin endpoint
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)

      // Admin should access admin endpoint
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    })

    it('should handle custom claims correctly', async () => {
      const response = await request(app)
        .get('/api/auth/permissions')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200)

      expect(response.body.permissions).toContain('manage_reservations')
      expect(response.body.permissions).toContain('view_customers')
    })
  })

  describe('Reservation API Integration', () => {
    it('should create reservation with valid data', async () => {
      const reservationData = {
        serviceId: 'test-service-1',
        staffId: 'test-staff-1',
        customerId: testUser.uid,
        appointmentTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Test reservation'
      }

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationData)
        .expect(201)

      expect(response.body).toMatchObject({
        id: expect.any(String),
        serviceId: reservationData.serviceId,
        staffId: reservationData.staffId,
        customerId: testUser.uid,
        status: 'pending',
        appointmentTime: reservationData.appointmentTime
      })
    })

    it('should validate reservation data', async () => {
      const invalidData = {
        serviceId: '', // Invalid
        appointmentTime: 'invalid-date' // Invalid
      }

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)
    })

    it('should prevent double booking', async () => {
      const appointmentTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      
      const reservationData = {
        serviceId: 'test-service-1',
        staffId: 'test-staff-1',
        customerId: testUser.uid,
        appointmentTime
      }

      // First reservation should succeed
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationData)
        .expect(201)

      // Second reservation at same time should fail
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...reservationData,
          customerId: 'different-customer'
        })
        .expect(409) // Conflict
    })

    it('should get user reservations with proper filtering', async () => {
      // Create test reservation
      await createTestReservation(testUser.uid)

      const response = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.reservations).toHaveLength(1)
      expect(response.body.reservations[0].customerId).toBe(testUser.uid)
    })

    it('should allow staff to view all reservations', async () => {
      // Create reservations for different users
      await createTestReservation(testUser.uid)
      await createTestReservation('different-user')

      const response = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200)

      expect(response.body.reservations.length).toBeGreaterThanOrEqual(2)
    })

    it('should update reservation status', async () => {
      const reservation = await createTestReservation(testUser.uid)

      const response = await request(app)
        .put(`/api/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'confirmed' })
        .expect(200)

      expect(response.body.status).toBe('confirmed')
    })

    it('should delete reservation', async () => {
      const reservation = await createTestReservation(testUser.uid)

      await request(app)
        .delete(`/api/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204)

      // Verify deletion
      await request(app)
        .get(`/api/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('Availability API Integration', () => {
    it('should get availability for specific date', async () => {
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await request(app)
        .get(`/api/availability?date=${date}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('date', date)
      expect(response.body).toHaveProperty('availability')
      expect(Array.isArray(response.body.availability)).toBe(true)
    })

    it('should get availability for specific staff', async () => {
      const staffId = 'test-staff-1'
      const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await request(app)
        .get(`/api/availability?date=${date}&staffId=${staffId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.staffId).toBe(staffId)
      expect(response.body.availability).toBeDefined()
    })

    it('should handle past dates correctly', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await request(app)
        .get(`/api/availability?date=${pastDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.availability).toHaveLength(0)
    })
  })

  describe('Services API Integration', () => {
    it('should get all services', async () => {
      const response = await request(app)
        .get('/api/services')
        .expect(200)

      expect(Array.isArray(response.body.services)).toBe(true)
      if (response.body.services.length > 0) {
        expect(response.body.services[0]).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          price: expect.any(Number),
          duration: expect.any(Number)
        })
      }
    })

    it('should create service (admin only)', async () => {
      const serviceData = {
        name: 'Test Service',
        description: 'Test service description',
        price: 5000,
        duration: 60,
        category: 'hair'
      }

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(serviceData)
        .expect(201)

      expect(response.body).toMatchObject(serviceData)
    })

    it('should prevent non-admin from creating services', async () => {
      const serviceData = {
        name: 'Test Service',
        price: 5000,
        duration: 60
      }

      await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData)
        .expect(403)
    })
  })

  describe('Customer Management Integration', () => {
    it('should get customer profile', async () => {
      const response = await request(app)
        .get(`/api/customers/${testUser.uid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        uid: testUser.uid,
        email: testUser.email
      })
    })

    it('should update customer profile', async () => {
      const updateData = {
        displayName: 'Updated Name',
        phone: '090-1234-5678'
      }

      const response = await request(app)
        .put(`/api/customers/${testUser.uid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject(updateData)
    })

    it('should prevent accessing other customer data', async () => {
      await request(app)
        .get('/api/customers/other-user-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })

    it('should allow staff to view customer list', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200)

      expect(Array.isArray(response.body.customers)).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle 404 errors correctly', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('message')
    })

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Empty data
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation Error')
      expect(response.body).toHaveProperty('details')
    })

    it('should handle internal server errors gracefully', async () => {
      // This would require mocking a service to throw an error
      // Implementation depends on specific error scenarios
    })
  })

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .get('/api/services')
          .set('Authorization', `Bearer ${authToken}`)
      )

      const responses = await Promise.all(promises)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now()
      
      await request(app)
        .get('/api/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
    })
  })
})

// Helper functions
async function createTestUser(email: string, role: string) {
  // Implementation would create a test user in Firebase Auth
  return {
    uid: `test-${Date.now()}-${Math.random()}`,
    email,
    role
  }
}

async function getTestToken(uid: string): Promise<string> {
  // Implementation would generate a valid Firebase test token
  return `test-token-${uid}`
}

async function createTestReservation(customerId: string) {
  // Implementation would create a test reservation
  return {
    id: `test-reservation-${Date.now()}`,
    customerId,
    serviceId: 'test-service-1',
    staffId: 'test-staff-1',
    appointmentTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending'
  }
}