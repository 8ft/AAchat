cd .\nsis-release
@call .\makeapp.bat

@call .\makeskinzip.bat %1

".\NSIS\makensis.exe" ".\SetupScripts\%1\config.nsi"

@rem 如果要调试错误，请使用下面的脚本，这样会打开编译界面（命令行界面中文会显示成?号）
@rem ".\NSIS\makensisw.exe" ".\SetupScripts\%1\config.nsi"