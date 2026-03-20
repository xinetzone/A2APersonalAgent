import os
import sys

project = 'A2A Personal Agent Docs'
author = 'A2A Team'
release = 'v1.0.0'

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
local_deps = os.path.join(repo_root, '.sphinx_deps')
if os.path.isdir(local_deps):
  sys.path.insert(0, local_deps)

extensions = [
  'myst_parser',
  'sphinx_copybutton',
]

templates_path = ['_templates']

source_suffix = {
  '.rst': 'restructuredtext',
  '.md': 'markdown',
}

master_doc = 'index'

exclude_patterns = [
  '_build',
  'build',
  '.DS_Store',
  'Thumbs.db',
]

myst_heading_anchors = 3

html_theme = 'sphinx_book_theme'
html_theme_options = {
  'collapse_navigation': False,
  'navigation_depth': 4,
  'sticky_navigation': True,
  'titles_only': False,
}

html_static_path = ['_static']
html_css_files = ['custom.css']

copybutton_prompt_text = r">>> |\.\.\. "
copybutton_prompt_is_regexp = True
