# A2A Personal Agent

## 文档站点（Sphinx）

文档源目录：`doc/`，构建输出：`build/html/`。

### 安装依赖（清华源）

```bash
conda activate py313
python -m pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
python -m pip config set global.trusted-host pypi.tuna.tsinghua.edu.cn

python -m pip install --upgrade --target .sphinx_deps sphinx-rtd-theme sphinxcontrib-jquery myst-parser sphinx-copybutton
```

### 构建

```bash
conda activate py313
python -m sphinx -b html source build/html
```

### 预览

直接用浏览器打开 `build/html/index.html`。
