write-host "`n  ## NODEJS INSTALLER ## `n"

### CONFIGURATION


function ExtractZip ($zipName) {
    $shell_app=new-object -com shell.application
    $zip_file = $shell_app.namespace((Get-Location).Path + "\$zipName")
    $destination = $shell_app.namespace((Get-Location).Path)
    $destination.Copyhere($zip_file.items())
}

# nodejs
$version = "7.9.0-x64"
$url = "https://nodejs.org/dist/v7.9.0/node-v$version.msi"

# git
$git_version = "2.9.2"
$git_url = "https://github.com/git-for-windows/git/releases/download/v$git_version.windows.1/Git-$git_version-64-bit.exe"

# activate / desactivate any install
$install_node = $TRUE
$install_git = $TRUE

write-host "`n----------------------------"
write-host " system requirements checking  "
write-host "----------------------------`n"

### require administator rights

if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
   write-Warning "This setup needs admin permissions. Please run this file as admin."     
   break
}

### nodejs version check

if (Get-Command node -errorAction SilentlyContinue) {
    $current_version = (node -v)
}
 
if ($current_version) {
    write-host "[NODE] nodejs $current_version already installed"
    $confirmation = read-host "Are you sure you want to replace this version ? [y/N]"
    if ($confirmation -ne "y") {
        $install_node = $FALSE
    }
}

write-host "`n"

### git install

if ($install_git) {
    if (Get-Command git -errorAction SilentlyContinue) {
        $git_current_version = (git --version)
    }

    if ($git_current_version) {
        write-host "[GIT] $git_current_version detected. Proceeding ..."
    } else {
        $git_exe = "$PSScriptRoot\git-installer.exe"

        write-host "No git version dectected"

        $download_git = $TRUE
        
        if (Test-Path $git_exe) {
            $confirmation = read-host "Local git install file detected. Do you want to use it ? [Y/n]"
            if ($confirmation -eq "n") {
                $download_git = $FALSE
            }
        }

        if ($download_git) {
            write-host "downloading the git for windows installer"
        
            $start_time = Get-Date
            $wc = New-Object System.Net.WebClient
            $wc.DownloadFile($git_url, $git_exe)
            write-Output "git installer downloaded"
            write-Output "Time taken: $((Get-Date).Subtract($start_time).Seconds) second(s)"
        }
        
        write-host "proceeding with git install ..."
        write-host "running $git_exe"
        start-Process $git_exe -Wait
        write-host "git installation done"
    }
}


if ($install_node) {
    
    ### download nodejs msi file
    # warning : if a node.msi file is already present in the current folder, this script will simply use it
        
    write-host "`n----------------------------"
    write-host "  nodejs msi file retrieving  "
    write-host "----------------------------`n"

    $filename = "node.msi"
    $node_msi = "$PSScriptRoot\$filename"
    
    $download_node = $TRUE

    if (Test-Path $node_msi) {
        $confirmation = read-host "Local $filename file detected. Do you want to use it ? [Y/n]"
        if ($confirmation -eq "n") {
            $download_node = $FALSE
        }
    }

    if ($download_node) {
        write-host "[NODE] downloading nodejs install"
        write-host "url : $url"
        $start_time = Get-Date
        $wc = New-Object System.Net.WebClient
        $wc.DownloadFile($url, $node_msi)
        write-Output "$filename downloaded"
        write-Output "Time taken: $((Get-Date).Subtract($start_time).Seconds) second(s)"
    } else {
        write-host "using the existing node.msi file"
    }

    ### nodejs install

    write-host "`n----------------------------"
    write-host " nodejs installation  "
    write-host "----------------------------`n"

    write-host "[NODE] running $node_msi"
    Start-Process $node_msi -Wait
    
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") 
    
} else {
    write-host "Proceeding with the previously installed nodejs version ..."
}

### npm packages install

write-host "`n----------------------------"
write-host " npm packages installation  "
write-host "----------------------------`n"

npm install -g forever
npm install -g serve 

#Installing chrome driver
$chromeDriverUrl = "https://chromedriver.storage.googleapis.com/2.29/chromedriver_win32.zip"
$chromeDriverOutput = "chromedriver.zip"

Invoke-WebRequest -Uri $chromeDriverUrl -OutFile $chromeDriverOutput
ExtractZip($chromeDriverOutput)
Move-Item -Path "$((Get-Location).Path)\chromedriver.exe" -Destination "C:\Windows\System32"

write-host "`n----------------------------"
write-host " installing nssm "
write-host "----------------------------`n"

$url = "https://nssm.cc/release/nssm-2.24.zip"
$nssmOutput = "nssm.zip"


Invoke-WebRequest -Uri $url -OutFile $nssmOutput

ExtractZip($nssmOutput)
Move-Item -Path "$((Get-Location).Path)\nssm-2.24\win64\nssm.exe" -Destination "C:\Windows\System32"

write-host "`n----------------------------"
write-host " Installing projects "
write-host "----------------------------`n" 

git clone https://github.com/YiftachE/cf.git
cd cf
git checkout develop
npm install
mkdir logs 
forever -o logs/out.log -e logs/err.log start index.js
cd ../

git clone https://github.com/YiftachE/cf_front
$currentPath = (Get-Location).Path
nssm install cf_frontend $env:AppData/npm/serve.cmd """-s $currentPath\cf_front\build"
nssm start cf_frontend


### clean

write-host "`n----------------------------"
write-host " system cleaning " 
write-host "----------------------------`n"
    if ($node_msi -and (Test-Path $node_msi)) {
        rm $node_msi
    }
    if ($git_exe -and (Test-Path $git_exe)) {
        rm $git_exe
    }



write-host "Done !"