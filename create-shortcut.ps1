$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Discord Notes Pro.lnk")
$Shortcut.TargetPath = "c:\Users\willi\OneDrive\Documents\Projects\Side quest\launch-app.bat"
$Shortcut.WorkingDirectory = "c:\Users\willi\OneDrive\Documents\Projects\Side quest"
$Shortcut.IconLocation = "C:\Windows\System32\shell32.dll, 165" # A different icon (Pro)
$Shortcut.Save()
