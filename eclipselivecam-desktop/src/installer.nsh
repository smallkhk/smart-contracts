; EclipseLiveCam custom NSIS installer script
; Sets installer page colors and branding text

!macro customHeader
  !system "echo Building EclipseLiveCam installer..."
!macroend

!macro customInstall
  ; Create a shortcut on the desktop
  CreateShortCut "$DESKTOP\EclipseLiveCam.lnk" "$INSTDIR\EclipseLiveCam.exe"
!macroend
