#!/bin/bash

# Staff Authentication API Test Script
# Tests all staff endpoints with different scenarios

API_URL="http://localhost:3000/api/staff"

echo "🧪 Testing Staff Authentication API"
echo "===================================="
echo ""

# Test 1: Login with admin credentials
echo "📝 Test 1: Login with admin (PIN: 1234)"
ADMIN_RESPONSE=$(curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "pin": "1234"}')

echo "$ADMIN_RESPONSE" | jq .

# Extract token for further tests
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token')
echo "Token: ${ADMIN_TOKEN:0:50}..."
echo ""

# Test 2: Login with manager credentials
echo "📝 Test 2: Login with manager (PIN: 5678)"
MANAGER_RESPONSE=$(curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "manager", "pin": "5678"}')

echo "$MANAGER_RESPONSE" | jq .
MANAGER_TOKEN=$(echo "$MANAGER_RESPONSE" | jq -r '.token')
echo ""

# Test 3: Login with staff credentials
echo "📝 Test 3: Login with staff (PIN: 9999)"
STAFF_RESPONSE=$(curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "staff", "pin": "9999"}')

echo "$STAFF_RESPONSE" | jq .
STAFF_TOKEN=$(echo "$STAFF_RESPONSE" | jq -r '.token')
echo ""

# Test 4: Login with invalid credentials
echo "📝 Test 4: Login with invalid PIN"
curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "pin": "0000"}' | jq .
echo ""

# Test 5: Login with non-existent user
echo "📝 Test 5: Login with non-existent user"
curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "hacker", "pin": "1234"}' | jq .
echo ""

# Test 6: Get current staff info (admin)
echo "📝 Test 6: Get staff info with valid token (admin)"
curl -s -X GET "${API_URL}/me" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq .
echo ""

# Test 7: Get current staff info (manager)
echo "📝 Test 7: Get staff info with valid token (manager)"
curl -s -X GET "${API_URL}/me" \
  -H "Authorization: Bearer ${MANAGER_TOKEN}" | jq .
echo ""

# Test 8: Get staff info without token
echo "📝 Test 8: Get staff info without token"
curl -s -X GET "${API_URL}/me" | jq .
echo ""

# Test 9: Get staff info with invalid token
echo "📝 Test 9: Get staff info with invalid token"
curl -s -X GET "${API_URL}/me" \
  -H "Authorization: Bearer invalid_token_123" | jq .
echo ""

# Test 10: List all staff (admin only)
echo "📝 Test 10: List all staff (admin role)"
curl -s -X GET "${API_URL}/list" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq .
echo ""

# Test 11: List all staff (manager - should fail)
echo "📝 Test 11: List all staff (manager role - should fail)"
curl -s -X GET "${API_URL}/list" \
  -H "Authorization: Bearer ${MANAGER_TOKEN}" | jq .
echo ""

# Test 12: Logout
echo "📝 Test 12: Logout"
curl -s -X POST "${API_URL}/logout" | jq .
echo ""

echo "✅ All tests completed!"
