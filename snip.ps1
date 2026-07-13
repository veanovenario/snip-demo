# PowerShell wrapper — forward all arguments to cli.js
$dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
node "$dir\cli.js" @args
