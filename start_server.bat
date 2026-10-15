@echo off
echo ========================================================
echo   Starting Procedural Audiovisual Synthesis Engine
echo ========================================================
echo Zero external assets - 100% Procedural HTML5 & Web Audio
echo Opening browser at http://localhost:8080 ...
start http://localhost:8080
python -m http.server 8080
pause
