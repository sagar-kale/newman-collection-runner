@echo off
set val=%2
if "%val%"=="" set val=false
node index.js env=%1 runAsSingle=%val%