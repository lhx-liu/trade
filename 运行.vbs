Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c start-production.bat", 0, False
Set WshShell = Nothing
