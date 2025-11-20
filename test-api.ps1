#!/usr/bin/env powershell

# Directory Listing API - Test Script
# This script tests all API endpoints to verify functionality

Write-Host "🚀 Directory Listing API Test Script" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Configuration
$BaseUrl = "http://localhost:3000"
$TestPath = "C:\Windows\System32"  # Change this to a valid path on your system

Write-Host "`n📋 Testing API endpoints..." -ForegroundColor Yellow

# Function to test an endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedPattern = ""
    )
    
    Write-Host "`n🔍 Testing: $Name" -ForegroundColor Cyan
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing
        $content = $response.Content
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Status: $($response.StatusCode) OK" -ForegroundColor Green
            
            # Try to parse as JSON and show formatted output
            try {
                $json = $content | ConvertFrom-Json
                if ($ExpectedPattern -and $content -match $ExpectedPattern) {
                    Write-Host "✅ Expected content pattern found" -ForegroundColor Green
                }
                Write-Host "📄 Response preview:" -ForegroundColor Blue
                if ($json.data) {
                    Write-Host "   Data type: $($json.data.GetType().Name)" -ForegroundColor Blue
                    if ($json.data.items) {
                        Write-Host "   Items found: $($json.data.items.Count)" -ForegroundColor Blue
                    }
                }
                # Show first 200 characters of response
                Write-Host "   $($content.Substring(0, [Math]::Min(200, $content.Length)))..." -ForegroundColor Gray
            }
            catch {
                Write-Host "   $($content.Substring(0, [Math]::Min(200, $content.Length)))" -ForegroundColor Gray
            }
        }
        else {
            Write-Host "❌ Status: $($response.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 1: Health Check
Test-Endpoint -Name "Health Check" -Url "$BaseUrl/health" -ExpectedPattern "OK"

# Test 2: API Information
Test-Endpoint -Name "API Information" -Url "$BaseUrl/api/v1/directory" -ExpectedPattern "Directory Listing API"

# Test 3: Directory Listing (small limit for testing)
$listUrl = "$BaseUrl/api/v1/directory/list?path=$TestPath&limit=5&sortBy=name"
Test-Endpoint -Name "Directory Listing" -Url $listUrl -ExpectedPattern "items"

# Test 4: Directory Listing with different sort
$sortUrl = "$BaseUrl/api/v1/directory/list?path=$TestPath&limit=3&sortBy=size&sortOrder=desc"
Test-Endpoint -Name "Directory Listing (sorted by size)" -Url $sortUrl -ExpectedPattern "items"

# Test 5: Directory Metadata
$metaUrl = "$BaseUrl/api/v1/directory/metadata?path=$TestPath"
Test-Endpoint -Name "Directory Metadata" -Url $metaUrl -ExpectedPattern "exists"

# Test 6: Error handling (invalid path)
Write-Host "`n🧪 Testing error handling..." -ForegroundColor Yellow
try {
    $errorUrl = "$BaseUrl/api/v1/directory/list?path=/invalid/path/that/does/not/exist"
    $response = Invoke-WebRequest -Uri $errorUrl -UseBasicParsing
    Write-Host "❌ Expected error but got success" -ForegroundColor Red
}
catch {
    Write-Host "✅ Error handling working: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# Test 7: Rate limiting (send multiple requests quickly)
Write-Host "`n⚡ Testing rate limiting..." -ForegroundColor Yellow
$requests = 1..5 | ForEach-Object {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing
        $response.StatusCode
    }
    catch {
        $_.Exception.Response.StatusCode
    }
}

$successCount = ($requests | Where-Object { $_ -eq 200 }).Count
Write-Host "✅ Rate limiting test: $successCount/5 requests succeeded" -ForegroundColor Green

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

Write-Host "`n📚 Usage Examples:" -ForegroundColor Yellow
Write-Host "List directory contents:" -ForegroundColor White
Write-Host "  curl `"$BaseUrl/api/v1/directory/list?path=C:\&limit=10`"" -ForegroundColor Gray
Write-Host "`nGet directory metadata:" -ForegroundColor White  
Write-Host "  curl `"$BaseUrl/api/v1/directory/metadata?path=C:\`"" -ForegroundColor Gray
Write-Host "`nWith PowerShell:" -ForegroundColor White
Write-Host "  Invoke-RestMethod -Uri `"$BaseUrl/api/v1/directory/list?path=C:\&limit=5`"" -ForegroundColor Gray