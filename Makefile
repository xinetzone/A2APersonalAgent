# Minimal Sphinx Makefile

SPHINXOPTS    ?=
SPHINXBUILD   ?= python -m sphinx
SOURCEDIR     = doc
BUILDDIR      = build

.PHONY: help clean html

help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS)

clean:
	@$(SPHINXBUILD) -M clean "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS)

html:
	@$(SPHINXBUILD) -M html "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS)

