<#
.SYNOPSIS
    Gera e instala um Certificado Digital Autoassinado de Code Signing no Windows.
.DESCRIPTION
    Resolve o aviso de "Fornecedor Desconhecido" do Windows SmartScreen em máquinas
    de desenvolvimento ou usuários que instalam o certificado na raiz de confiança (Trusted Root).
#>

param(
    [string]$CertName = "Open Trainer Engine CA",
    [string]$CertFile = "assets\open-trainer-engine.pfx",
    [string]$Password = "OpenTrainer2026!"
)

Write-Host "Criando Certificado de Code Signing para: $CertName..." -ForegroundColor Cyan

# Cria o certificado de assinatura de código
$cert = New-SelfSignedCertificate -Subject "CN=$CertName, O=Open Trainer Engine, OU=Development" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyUsage DigitalSignature `
    -KeySpec Signature `
    -Type CodeSigningCert `
    -NotAfter (Get-Date).AddYears(5)

$secPassword = ConvertTo-SecureString -String $Password -Force -AsPlainText

# Exporta arquivo PFX
if (!(Test-Path "assets")) {
    New-Item -ItemType Directory -Path "assets" | Out-Null
}

Export-PfxCertificate -Cert $cert -FilePath $CertFile -Password $secPassword | Out-Null
Write-Host "Certificado gerado com sucesso em: $CertFile" -ForegroundColor Green

# Instala automaticamente na Autoridade de Certificação Raiz Confiável da máquina local
Write-Host "Confiando no certificado no Windows (Trusted Root)..." -ForegroundColor Yellow
$store = New-Object System.Security.Cryptography.X509Certificates.X509Store "Root", "CurrentUser"
$store.Open("ReadWrite")
$store.Add($cert)
$store.Close()

Write-Host "Certificado instalado nas Raizes Confiaveis do Windows com sucesso!" -ForegroundColor Green
Write-Host "O SmartScreen nao acusara mais fornecedor desconhecido para binarios assinados com este certificado." -ForegroundColor Cyan
