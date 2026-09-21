$ErrorActionPreference = 'Stop'
$Base = if ($env:BFL_API_BASE) { $env:BFL_API_BASE.TrimEnd('/') } else { 'http://localhost:8080/api' }
$Headers = @{ 'Content-Type' = 'application/json' }

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Url,
    [string]$Body
  )

  try {
    if ($Body) {
      return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $Body
    }
    return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $detail = $_.ErrorDetails.Message
    if ($status -eq 409) {
      Write-Host "SKIP (already exists) $Url"
      return $null
    }
    throw "FAILED $Method $Url [$status] $detail"
  }
}

function Get-IdMap {
  param([string]$Path, [string]$Key = 'code')
  $rows = Invoke-Json -Method GET -Url "$Base$Path"
  $map = @{}
  foreach ($row in @($rows)) {
    $map[$row.$Key] = [string]$row._id
  }
  return $map
}

Write-Host "Seeding BFL masters via $Base"

$processes = @(
  @{ code = 'RECEIVING'; name = 'Receiving'; description = 'Parcels enter warehouse'; sequence = 1; capacityPerHour = 3200; sla = 30; slaUnit = 'MIN'; isActive = $true }
  @{ code = 'CHECKING'; name = 'Checking'; description = 'Quality and document verification'; sequence = 2; capacityPerHour = 2900; sla = 30; slaUnit = 'MIN'; isActive = $true }
  @{ code = 'TAGGING'; name = 'Tagging'; description = 'Label and barcode tagging'; sequence = 3; capacityPerHour = 2700; sla = 30; slaUnit = 'MIN'; isActive = $true }
  @{ code = 'ALLOCATION'; name = 'Allocation'; description = 'Assign destination and route'; sequence = 4; capacityPerHour = 3000; sla = 15; slaUnit = 'MIN'; isActive = $true }
  @{ code = 'SORTING'; name = 'Sorting'; description = 'Sort parcels by destination'; sequence = 5; capacityPerHour = 2400; sla = 45; slaUnit = 'MIN'; isActive = $true }
  @{ code = 'STAGING'; name = 'Staging'; description = 'Prepare parcels for dispatch'; sequence = 6; capacityPerHour = 2700; sla = 1; slaUnit = 'HOUR'; isActive = $true }
  @{ code = 'DISPATCH'; name = 'Dispatch'; description = 'Final outbound shipment'; sequence = 7; capacityPerHour = 2800; sla = 1; slaUnit = 'HOUR'; isActive = $true }
)

foreach ($item in $processes) {
  $null = Invoke-Json -Method POST -Url "$Base/processmaster" -Body ($item | ConvertTo-Json -Compress)
  Write-Host "Process $($item.code)"
}

$warehouses = @(
  @{ code = 'TECHNO'; name = 'TECHNO Warehouse'; description = 'Main sorting warehouse — processing and robo sorting'; location = 'Dubai'; country = 'UAE'; timeZone = 'Asia/Dubai'; isActive = $true }
  @{ code = 'JAFZA'; name = 'JAFZA Warehouse'; description = 'Free zone distribution center — consolidation and counting'; location = 'Jebel Ali'; country = 'UAE'; timeZone = 'Asia/Dubai'; isActive = $true }
  @{ code = 'YOTO'; name = 'YOTO Warehouse'; description = 'Regional fulfillment center — inbound hub'; location = 'Abu Dhabi'; country = 'UAE'; timeZone = 'Asia/Dubai'; isActive = $true }
)

foreach ($item in $warehouses) {
  $null = Invoke-Json -Method POST -Url "$Base/warehousemaster" -Body ($item | ConvertTo-Json -Compress)
  Write-Host "Warehouse $($item.code)"
}

$processMap = Get-IdMap '/processmaster'
$warehouseMap = Get-IdMap '/warehousemaster'

function New-ProcessRow($code, $capacity, $sla, $unit) {
  return @{
    processId = $processMap[$code]
    enabled = $true
    capacityPerHour = $capacity
    sla = $sla
    slaUnit = $unit
  }
}

function New-Resource($type, $code, $planned, $available, $productivity) {
  return @{
    resourceType = $type
    processId = $processMap[$code]
    plannedQuantity = $planned
    availableQuantity = $available
    productivity = $productivity
    unit = 'Items/Hour'
    isActive = $true
  }
}

$configs = @(
  @{
    warehouseId = $warehouseMap['TECHNO']
    name = 'TECHNO Default'
    effectiveFrom = '2026-08-15'
    isActive = $true
    processes = @(
      (New-ProcessRow 'RECEIVING' 3200 20 'MIN')
      (New-ProcessRow 'CHECKING' 2700 25 'MIN')
      (New-ProcessRow 'TAGGING' 2500 25 'MIN')
      (New-ProcessRow 'ALLOCATION' 2600 20 'MIN')
      (New-ProcessRow 'SORTING' 2800 30 'MIN')
      (New-ProcessRow 'STAGING' 1900 35 'MIN')
      (New-ProcessRow 'DISPATCH' 1800 25 'MIN')
    )
    resources = @(
      (New-Resource 'Operator' 'RECEIVING' 10 10 320)
      (New-Resource 'Operator' 'CHECKING' 9 9 300)
      (New-Resource 'Operator' 'TAGGING' 8 8 312)
      (New-Resource 'Operator' 'ALLOCATION' 7 7 371)
      (New-Resource 'Operator' 'SORTING' 14 12 175)
      (New-Resource 'Robot' 'SORTING' 18 16 131)
      (New-Resource 'Chute' 'SORTING' 30 24 100)
      (New-Resource 'Operator' 'STAGING' 6 6 317)
      (New-Resource 'Chute' 'STAGING' 8 8 240)
      (New-Resource 'Operator' 'DISPATCH' 6 6 300)
    )
  }
  @{
    warehouseId = $warehouseMap['JAFZA']
    name = 'JAFZA Default'
    effectiveFrom = '2026-08-15'
    isActive = $true
    processes = @(
      (New-ProcessRow 'RECEIVING' 2800 30 'MIN')
      (New-ProcessRow 'CHECKING' 3000 25 'MIN')
      (New-ProcessRow 'TAGGING' 2400 30 'MIN')
      (New-ProcessRow 'ALLOCATION' 2500 20 'MIN')
      (New-ProcessRow 'SORTING' 2200 45 'MIN')
      (New-ProcessRow 'STAGING' 2400 1 'HOUR')
      (New-ProcessRow 'DISPATCH' 2500 1 'HOUR')
    )
    resources = @(
      (New-Resource 'Operator' 'RECEIVING' 8 8 300)
      (New-Resource 'Operator' 'CHECKING' 12 11 280)
      (New-Resource 'Operator' 'TAGGING' 7 7 300)
      (New-Resource 'Operator' 'ALLOCATION' 6 6 350)
      (New-Resource 'Operator' 'SORTING' 10 9 180)
      (New-Resource 'Robot' 'SORTING' 14 12 120)
      (New-Resource 'Chute' 'SORTING' 24 20 110)
      (New-Resource 'Operator' 'STAGING' 6 6 300)
      (New-Resource 'Chute' 'STAGING' 6 6 220)
      (New-Resource 'Operator' 'DISPATCH' 7 7 290)
    )
  }
  @{
    warehouseId = $warehouseMap['YOTO']
    name = 'YOTO Default'
    effectiveFrom = '2026-08-15'
    isActive = $true
    processes = @(
      (New-ProcessRow 'RECEIVING' 3400 25 'MIN')
      (New-ProcessRow 'CHECKING' 2600 30 'MIN')
      (New-ProcessRow 'TAGGING' 2500 30 'MIN')
      (New-ProcessRow 'ALLOCATION' 2700 20 'MIN')
      (New-ProcessRow 'SORTING' 2300 40 'MIN')
      (New-ProcessRow 'STAGING' 2500 1 'HOUR')
      (New-ProcessRow 'DISPATCH' 2600 1 'HOUR')
    )
    resources = @(
      (New-Resource 'Operator' 'RECEIVING' 12 11 310)
      (New-Resource 'Operator' 'CHECKING' 8 8 290)
      (New-Resource 'Operator' 'TAGGING' 8 8 300)
      (New-Resource 'Operator' 'ALLOCATION' 6 6 360)
      (New-Resource 'Operator' 'SORTING' 10 9 185)
      (New-Resource 'Robot' 'SORTING' 16 14 125)
      (New-Resource 'Chute' 'SORTING' 22 18 105)
      (New-Resource 'Operator' 'STAGING' 5 5 310)
      (New-Resource 'Chute' 'STAGING' 6 6 230)
      (New-Resource 'Operator' 'DISPATCH' 6 6 300)
    )
  }
)

foreach ($config in $configs) {
  if (-not $config.warehouseId) {
    throw "Warehouse id missing for $($config.name). Restart backend if /warehousemaster is empty."
  }
  $null = Invoke-Json -Method POST -Url "$Base/configuration" -Body ($config | ConvertTo-Json -Depth 8 -Compress)
  Write-Host "Configuration $($config.name)"
}

Write-Host 'Seed complete.'
Write-Host "Processes: $((Invoke-Json GET "$Base/processmaster").Count)"
Write-Host "Warehouses: $((Invoke-Json GET "$Base/warehousemaster").Count)"
Write-Host "Configurations: $((Invoke-Json GET "$Base/configuration").Count)"
