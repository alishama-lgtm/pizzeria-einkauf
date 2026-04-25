Write-Host "Beende alle node.exe Prozesse..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$port = 3000
$pids = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
foreach ($p in $pids) {
    if ($p -and $p -ne 0) {
        Write-Host "Stoppe Prozess $p auf Port $port"
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

Write-Host "Starte Server..."
Set-Location "C:\Users\shama\Claude\Pizzaria\.claude\San Carino\aktuell"
node server.js
