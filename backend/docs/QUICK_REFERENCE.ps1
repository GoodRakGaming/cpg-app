#!/usr/bin/env powershell
# Phase 5 Quick Reference Guide
# Copy-paste commands for testing PDF endpoints

# =================================================================
# SETUP
# =================================================================

# Start the server (in separate terminal):
# cd backend
# npm run dev

# =================================================================
# TEST 1: Generate PDF
# =================================================================

$baseUrl = "http://localhost:3000"
$testEmail = "test.$((Get-Date).Ticks)@example.com"

# Register
$reg = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{ email=$testEmail; password="Test123!"; first_name="T"; last_name="T" } | ConvertTo-Json)

# Login and get token
$login = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{ email=$testEmail; password="Test123!" } | ConvertTo-Json)
$token = ($login.Content | ConvertFrom-Json).data.access_token

# Create template
$tmpl = Invoke-WebRequest -Uri "$baseUrl/api/templates" -Method POST `
  -Headers @{ "Authorization"="Bearer $token"; "Content-Type"="application/json" } `
  -Body (@{ name="Test"; description="Test"; data=@{} } | ConvertTo-Json)
$templateId = ($tmpl.Content | ConvertFrom-Json).data.template.id

# Create proposal
$prop = Invoke-WebRequest -Uri "$baseUrl/api/proposals" -Method POST `
  -Headers @{ "Authorization"="Bearer $token"; "Content-Type"="application/json" } `
  -Body (@{ title="Test"; template_id=$templateId; status="draft" } | ConvertTo-Json)
$proposalId = ($prop.Content | ConvertFrom-Json).data.proposal.id

# Generate PDF
$pdf = Invoke-WebRequest -Uri "$baseUrl/api/pdf/generate/$proposalId" -Method POST `
  -Headers @{ "Authorization"="Bearer $token" }
Write-Host "✅ PDF Generated: $($pdf.Content.Length) bytes"

# =================================================================
# TEST 2: Download PDF
# =================================================================

$download = Invoke-WebRequest -Uri "$baseUrl/api/pdf/$proposalId" -Method GET `
  -Headers @{ "Authorization"="Bearer $token" } -OutFile "proposal.pdf"
Write-Host "✅ PDF Downloaded: proposal.pdf"

# =================================================================
# TEST 3: Export PDF with Options
# =================================================================

$export = Invoke-WebRequest -Uri "$baseUrl/api/pdf/export/$proposalId" -Method POST `
  -Headers @{ "Authorization"="Bearer $token"; "Content-Type"="application/json" } `
  -Body (@{ format="Letter"; margin=@{top="15mm"}; printBackground=$true } | ConvertTo-Json)
Write-Host "✅ PDF Exported: $($export.Content.Length) bytes"

# =================================================================
# TEST 4: Get PDF Status
# =================================================================

$status = Invoke-WebRequest -Uri "$baseUrl/api/pdf/status/$proposalId" -Method GET `
  -Headers @{ "Authorization"="Bearer $token" }
$statusData = ($status.Content | ConvertFrom-Json).data
Write-Host "✅ PDF Status:"
Write-Host "   - Proposal ID: $($statusData.proposal_id)"
Write-Host "   - Title: $($statusData.title)"
Write-Host "   - PDF Hash: $($statusData.pdf_hash.Substring(0,16))..."
Write-Host "   - Cached: $($statusData.is_cached)"
Write-Host "   - Status: $($statusData.status)"

# =================================================================
# ENDPOINT REFERENCE
# =================================================================

# POST /api/pdf/generate/:proposalId
# - Generate PDF from proposal
# - Returns: PDF binary stream (inline)
# - Status: 201/200 OK

# GET /api/pdf/:proposalId
# - Download proposal as PDF
# - Returns: PDF binary stream (attachment)
# - Status: 200 OK

# POST /api/pdf/export/:proposalId
# - Export with custom formatting
# - Body: {format, margin, printBackground}
# - Returns: PDF binary stream (attachment)
# - Status: 200 OK

# GET /api/pdf/status/:proposalId
# - Get PDF status and cache info
# - Returns: JSON with pdf_hash and is_cached
# - Status: 200 OK

# =================================================================
# ERROR CODES
# =================================================================

# 200 OK - Successful request
# 201 Created - Resource created
# 400 Bad Request - Invalid input
# 401 Unauthorized - Missing token
# 403 Forbidden - Access denied (not owner)
# 404 Not Found - Proposal doesn't exist
# 410 Gone - Proposal deleted (soft delete)
# 500 Server Error - Generation failed

# =================================================================
# TROUBLESHOOTING
# =================================================================

# ❌ "Access denied"
# → Check that you're using the same user for auth and PDF generation
# → Verify Bearer token is valid and not expired

# ❌ "Proposal not found"
# → Use correct proposal ID from creation response
# → Check that proposal was successfully created

# ❌ "Server connection failed"
# → Make sure backend server is running (npm run dev)
# → Check port 3000 is not in use

# ❌ PDF file is empty
# → Wait a few seconds for Puppeteer to render
# → Check that template/proposal data is valid

# =================================================================
# USEFUL SCRIPTS
# =================================================================

# Save token to variable for later use
$token | Out-File -FilePath token.txt

# Save PDF to file
$pdf = Invoke-WebRequest -Uri "$baseUrl/api/pdf/generate/$proposalId" `
  -Method POST -Headers @{ "Authorization"="Bearer $token" } -OutFile "export.pdf"

# Test all 4 endpoints in sequence
powershell -ExecutionPolicy Bypass -File PHASE_5_QUICK_TESTS.ps1

# =================================================================
# ENDPOINTS SUMMARY
# =================================================================

# Complete PDF API:
# 1. POST   /api/pdf/generate/:proposalId   → Generate PDF
# 2. GET    /api/pdf/:proposalId             → Download PDF
# 3. POST   /api/pdf/export/:proposalId      → Export with options
# 4. GET    /api/pdf/status/:proposalId      → Get status

# All 20 backend endpoints:
# 4x Auth    /api/auth/*
# 5x Template /api/templates/*
# 7x Proposal /api/proposals/*
# 4x PDF     /api/pdf/*

# =================================================================
