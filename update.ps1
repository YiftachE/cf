write-host "`n  ## CF-Updater ## `n"
write-host "`n  ## Update Server ## `n"
cd cf
git pull
forever stopall
forever -o logs\out.log -e logs\err.log start index.js
cd ..
write-host "`n  ## Update Client ## `n"

cd cf_front
git pull
nssm restart cf_frontend

