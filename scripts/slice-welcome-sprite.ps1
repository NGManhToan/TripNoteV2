Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path $PSScriptRoot -Parent
$sourcePath = Join-Path $projectRoot 'src\assets\images\welcome-sprite.png'
$outputDirectory = Join-Path $projectRoot 'src\assets\images\welcome'

if (-not (Test-Path -LiteralPath $sourcePath)) {
  throw "Sprite sheet not found: $sourcePath"
}

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$regions = [ordered]@{
  earth = @(0, 0, 365, 315)
  plane = @(368, 15, 372, 200)
  'plane-small' = @(718, 72, 245, 160)
  orbit = @(963, 7, 327, 278)
  sun = @(1298, 0, 238, 320)
  'cloud-1' = @(0, 305, 300, 170)
  'cloud-2' = @(300, 296, 315, 164)
  'cloud-3' = @(615, 296, 296, 160)
  'cloud-4' = @(906, 292, 306, 164)
  'cloud-5' = @(1208, 294, 328, 162)
  'photo-islands' = @(14, 470, 264, 210)
  'photo-temple' = @(277, 470, 264, 210)
  'photo-city' = @(540, 470, 264, 210)
  'photo-mountains' = @(803, 470, 264, 210)
  suitcase = @(1052, 430, 278, 260)
  lighthouse = @(1355, 430, 181, 274)
  sea = @(0, 675, 824, 205)
  birds = @(820, 680, 370, 172)
  'icon-map' = @(1184, 696, 126, 170)
  'icon-camera' = @(1308, 696, 120, 170)
  'icon-compass' = @(1440, 696, 96, 170)
  'sparkles-warm' = @(0, 868, 444, 156)
  'sparkles-cool' = @(442, 868, 245, 156)
  'cta-swoosh' = @(680, 868, 414, 156)
  'glow-blue' = @(1172, 850, 76, 174)
  'orbit-blue' = @(1218, 850, 318, 174)
}

$sheet = [System.Drawing.Bitmap]::FromFile($sourcePath)
try {
  foreach ($entry in $regions.GetEnumerator()) {
    $bounds = $entry.Value
    $rectangle = [System.Drawing.Rectangle]::new($bounds[0], $bounds[1], $bounds[2], $bounds[3])
    $crop = $sheet.Clone($rectangle, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $destination = Join-Path $outputDirectory ($entry.Key + '.png')
      $crop.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
      $crop.Dispose()
    }
  }
}
finally {
  $sheet.Dispose()
}
