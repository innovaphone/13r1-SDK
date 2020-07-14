VPX-Library:
* Download prerequisit yasm Win64 .exe from https://yasm.tortall.net/Download.html 
* put the yasm.exe into a tools path which is inside your PATH variable
* Download from: https://chromium.googlesource.com/webm/libvpx
* extract somewhere
# configure in Cygwin/Msys build env
* cd build
* ../configure --target=x86-win32-vs14 --enable-vp8 --enable-vp9 --disable-multithread --enable-error-concealment --enable-coefficient-range-checking --enable-runtime-cpu-detect --enable-multi-res-encoding --enable-libyuv
(if possible vs15)   
    --enable-vp8                    VP8 codec support
    --enable-vp9                    VP9 codec support
    --disable-multithread
    --enable-error-concealment      enable this option to get a decoder which is able to conceal losses
    --enable-coefficient-range-checking
                                  enable decoder to check if intermediate
                                  transform coefficients are in valid range
    --enable-runtime-cpu-detect     runtime cpu detection
    --enable-multi-res-encoding     enable multiple-resolution encoding
    --enable-libyuv                 enable libyuv

* make
* open newly created solution vpx.sln
* upgrade solution files with VS2019
* build debug
* build release
* copy libraries

Chromium-CEF:
* Download and install CMake from https://cmake.org/download/
* Download and extract CEF sources from http://opensource.spotify.com/cefbuilds/index.html
* cmake.exe -G "Visual Studio 16 2019" -A Win32
* open newly created solution cef.sln
* change runtime library to multithreaded DLL /MD inside release configuration
* change runtime library to multithreaded debug DLL /MDd inside debug configuration
* build release of project libcef_dll_wrapper
* build debug of project libcef_dll_wrapper
* copy libraries
* replace folders include, Release and Resources inside sdk\common\windows\chromium

libpng:
* Download and extract sources from https://sourceforge.net/projects/libpng/files/libpng16/1.6.37/
* Download and extract into zlib in the root of libpng sources from https://zlib.net/ (e.g. https://zlib.net/zlib1211.zip)
* Edit zlib.props and enter <ZLibSrcDir>..\..\..\zlib</ZLibSrcDir> instead of the old line
* open projects\vstudio\vstudio.sln
* build "Release library" of the projects zlib and libpng
* build "Debug library" of the projects zlib and libpng
* copy libraries

openssl:
* download prerequisit nasm win64 exe from https://www.nasm.us/pub/nasm/releasebuilds/?C=M;O=D
* download and install prerequisit perl
* put into a folder which is inside your PATH variable
* download openssl 1.1.1x sources from https://www.openssl.org/source/
* open the Developer command prompt for Visual studio 2019 (type in windows search)
* perl Configure VC-WIN32 enable-capieng no-shared --prefix=C:\Build-OpenSSL-VC-32
* nmake
* copy libcrypto.lib 
* copy libssl.lib

jpeg:
* download jpeg-9c

snappy:
* download and extract a release from https://github.com/google/snappy (currently 1.1.7)
* run cmake.exe -G "Visual Studio 16 2019" -A Win32
* open config.h and change defines SNAPPY_HAVE_SSSE3 and SNAPPY_HAVE_BMI2 to 0
* open Snappy.sln with VS 2019
* make a release and debug build and copy snappy.lib

