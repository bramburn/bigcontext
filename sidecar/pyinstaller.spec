# -*- mode: python ; coding: utf-8 -*-

import sys
import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Collect data files for FastAPI and other dependencies
datas = []
datas += collect_data_files('fastapi')
datas += collect_data_files('uvicorn')
datas += collect_data_files('pydantic')

# Collect hidden imports
hiddenimports = []
hiddenimports += collect_submodules('uvicorn')
hiddenimports += collect_submodules('fastapi')
hiddenimports += collect_submodules('pydantic')
hiddenimports += [
    'uvicorn.lifespan.on',
    'uvicorn.lifespan.off',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.websockets.websockets_impl',
    'uvicorn.protocols.websockets.wsproto_impl',
    'uvicorn.loops.auto',
    'uvicorn.loops.asyncio',
    'uvicorn.loops.uvloop',
    'uvicorn.logging',
    'multipart',
    'email.mime.multipart',
    'email.mime.text',
    'email.mime.base',
    'psutil._psutil_windows' if sys.platform == 'win32' else 'psutil._psutil_posix',
]

# Platform-specific configurations
if sys.platform == 'win32':
    # Windows-specific settings
    icon_file = None  # Add .ico file path if you have one
    console = True
    name_suffix = '.exe'
elif sys.platform == 'darwin':
    # macOS-specific settings
    icon_file = None  # Add .icns file path if you have one
    console = True
    name_suffix = ''
else:
    # Linux-specific settings
    icon_file = None
    console = True
    name_suffix = ''

# Determine output name based on platform
output_name = f'code-context-sidecar-{sys.platform}{name_suffix}'

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude unnecessary modules to reduce size
        'tkinter',
        'matplotlib',
        'numpy',
        'scipy',
        'pandas',
        'PIL',
        'PyQt5',
        'PyQt6',
        'PySide2',
        'PySide6',
        'jupyter',
        'notebook',
        'IPython',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

# Remove duplicate entries
pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name=output_name,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,  # Enable UPX compression if available
    upx_exclude=[],
    runtime_tmpdir=None,
    console=console,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=icon_file,
)

# macOS app bundle (optional)
if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name=f'{output_name}.app',
        icon=icon_file,
        bundle_identifier='com.icelabz.code-context-sidecar',
        info_plist={
            'CFBundleDisplayName': 'Code Context Sidecar',
            'CFBundleVersion': '0.1.0',
            'CFBundleShortVersionString': '0.1.0',
            'NSHighResolutionCapable': True,
        },
    )
