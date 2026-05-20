# Phase 5 - PDF Generation Engine Testing Guide

## Overview
Phase 5 implements PDF generation functionality using Puppeteer, allowing proposal data to be converted to professional PDF documents.

## Quick Start Tests

### 1. Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health" `
  -Method GET | Select-Object -ExpandProperty Content
```

### 2. Register & Login (from Phase 2)
```powershell
# Register user
$body = @{
  email = "pdf.test@example.com"
  password = "PdfTest123!"
  first_name = "PDF"
  last_name = "Tester"
} | ConvertTo-Json

$regResult = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

$user = $regResult.Content | ConvertFrom-Json
Write-Host "✅ User registered: $($user.data.id)"

# Login
$loginBody = @{
  email = "pdf.test@example.com"
  password = "PdfTest123!"
} | ConvertTo-Json

$loginResult = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $loginBody

$loginData = $loginResult.Content | ConvertFrom-Json
$token = $loginData.data.access_token
Write-Host "✅ Login successful, token: $($token.Substring(0,20))..."

# Save for reuse
$accessToken = $token
```

### 3. Create Template (from Phase 3)
```powershell
$templateBody = @{
  name = "PDF Test Template"
  description = "Template for PDF generation testing"
  data = @{
    items = @(
      @{
        name = "Service A"
        description = "Professional consulting service"
        quantity = 1
        price = 5000
      },
      @{
        name = "Service B"
        description = "Development work"
        quantity = 2
        price = 3000
      }
    )
    terms = "Payment terms: Net 30 days"
  }
} | ConvertTo-Json

$templateResult = Invoke-WebRequest -Uri "http://localhost:3000/api/templates" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
  } `
  -Body $templateBody

$template = $templateResult.Content | ConvertFrom-Json
$templateId = $template.data.id
Write-Host "✅ Template created: $templateId"
```

### 4. Create Proposal (from Phase 4)
```powershell
$proposalBody = @{
  title = "Q2 2026 Proposal"
  template_id = $templateId
  status = "draft"
  data = @{
    description = "This is a test proposal for PDF generation"
  }
} | ConvertTo-Json

$proposalResult = Invoke-WebRequest -Uri "http://localhost:3000/api/proposals" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
  } `
  -Body $proposalBody

$proposal = $proposalResult.Content | ConvertFrom-Json
$proposalId = $proposal.data.id
Write-Host "✅ Proposal created: $proposalId"
```

### 5. Generate PDF (Phase 5 - NEW)
```powershell
# Generate and download PDF
$pdfResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/pdf/generate/$proposalId" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $accessToken"
  }

# Save to file
$pdfPath = "C:\Temp\proposal_$proposalId.pdf"
[System.IO.File]::WriteAllBytes($pdfPath, $pdfResponse.Content)
Write-Host "✅ PDF generated and saved: $pdfPath"
Write-Host "📄 File size: $($pdfResponse.Content.Length) bytes"
```

### 6. Download PDF (Phase 5 - NEW)
```powershell
# Download previously generated PDF
$downloadResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/pdf/$proposalId" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $accessToken"
  }

$downloadPath = "C:\Temp\proposal_download_$proposalId.pdf"
[System.IO.File]::WriteAllBytes($downloadPath, $downloadResponse.Content)
Write-Host "✅ PDF downloaded: $downloadPath"
```

### 7. Export PDF with Options (Phase 5 - NEW)
```powershell
# Export with custom formatting
$exportBody = @{
  format = "A4"
  margin = @{
    top = "15mm"
    right = "15mm"
    bottom = "15mm"
    left = "15mm"
  }
  printBackground = $true
} | ConvertTo-Json

$exportResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/pdf/export/$proposalId" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
  } `
  -Body $exportBody

$exportPath = "C:\Temp\proposal_export_$proposalId.pdf"
[System.IO.File]::WriteAllBytes($exportPath, $exportResponse.Content)
Write-Host "✅ PDF exported: $exportPath"
```

### 8. Get PDF Status (Phase 5 - NEW)
```powershell
# Check PDF generation status and cache hash
$statusResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/pdf/status/$proposalId" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $accessToken"
  }

$status = $statusResponse.Content | ConvertFrom-Json
Write-Host "✅ PDF Status:"
Write-Host "   Proposal: $($status.data.title)"
Write-Host "   Status: $($status.data.status)"
Write-Host "   PDF Hash: $($status.data.pdf_hash)"
Write-Host "   Cached: $($status.data.is_cached)"
```

## Error Cases Testing

### Missing Authorization
```powershell
# Should return 403 error
Invoke-WebRequest -Uri "http://localhost:3000/api/pdf/generate/$proposalId" `
  -Method POST | Select-Object StatusCode, StatusDescription
```

### Invalid Proposal ID
```powershell
# Should return 404 error
Invoke-WebRequest -Uri "http://localhost:3000/api/pdf/generate/invalid-id-12345" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $accessToken"
  } `
  -ErrorAction SilentlyContinue | Select-Object StatusCode, StatusDescription
```

### Deleted Proposal
```powershell
# Delete the proposal first
Invoke-WebRequest -Uri "http://localhost:3000/api/proposals/$proposalId" `
  -Method DELETE `
  -Headers @{
    "Authorization" = "Bearer $accessToken"
  }

# Try to generate PDF for deleted proposal
Invoke-WebRequest -Uri "http://localhost:3000/api/pdf/generate/$proposalId" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $accessToken"
  } `
  -ErrorAction SilentlyContinue | Select-Object StatusCode, StatusDescription
```

## Expected Results

✅ **Success Cases (200/201)**:
- POST /api/pdf/generate/:proposalId - Returns PDF stream
- GET /api/pdf/:proposalId - Returns PDF stream
- POST /api/pdf/export/:proposalId - Returns PDF stream with options
- GET /api/pdf/status/:proposalId - Returns status JSON

❌ **Error Cases**:
- 403 (Forbidden) - Access denied (different user's proposal)
- 404 (Not Found) - Proposal doesn't exist
- 410 (Gone) - Proposal has been deleted
- 500 (Server Error) - PDF generation failed

## Implementation Details

### Files Created
- `backend/src/services/pdfService.js` (420 lines) - PDF generation logic with Puppeteer
- `backend/src/routes/pdf.js` (280 lines) - 4 PDF endpoints
- Updated `backend/src/server.js` - Registered PDF routes

### Key Features
- ✅ Puppeteer-based HTML to PDF conversion
- ✅ Custom HTML template generation from proposal data
- ✅ PDF hash caching for performance
- ✅ Graceful browser instance management
- ✅ Access control on all endpoints
- ✅ Support for custom formatting options
- ✅ Professional PDF styling with CSS

### New Endpoints (4 total)
1. **POST /api/pdf/generate/:proposalId** - Generate PDF from proposal (with caching)
2. **GET /api/pdf/:proposalId** - Download proposal PDF
3. **POST /api/pdf/export/:proposalId** - Export with formatting options
4. **GET /api/pdf/status/:proposalId** - Get PDF generation status

## Phase 5 Checklist

- [x] Install Puppeteer dependency
- [x] Create PDF service module with HTML generation
- [x] Implement PDF generation logic (Puppeteer)
- [x] Create PDF route endpoints (4 endpoints)
- [x] Add access control to all endpoints
- [x] Implement PDF caching with hash
- [x] Add graceful shutdown for browser
- [x] Create comprehensive styling for PDF output
- [x] Register routes in server.js
- [ ] Run comprehensive testing
- [ ] Create Phase 5 documentation

## Next Steps
1. Run the test suite above
2. Verify all 4 new endpoints return proper responses
3. Check PDF files are generated correctly
4. Verify access control works
5. Create Phase 5 completion documentation
