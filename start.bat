@echo off
:loop
echo Démarrage du bot...
node index.js
echo Le bot s'est arrêté. Redémarrage dans 30 secondes...
timeout /t 30
goto loop
