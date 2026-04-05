@ECHO OFF

set SPHINXBUILD=python -m sphinx
set SOURCEDIR=doc
set BUILDDIR=build

if "%1"=="" goto help

%SPHINXBUILD% -M %1 %SOURCEDIR% %BUILDDIR% %SPHINXOPTS%
goto end

:help
%SPHINXBUILD% -M help %SOURCEDIR% %BUILDDIR% %SPHINXOPTS%

:end

