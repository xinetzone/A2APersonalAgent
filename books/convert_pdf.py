import pdfplumber

pdf_path = r'D:\AI\帛书老子注读.pdf'
output_path = r'D:\AI\帛书老子注读.md'

try:
    with pdfplumber.open(pdf_path) as pdf:
        full_text = []
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                full_text.append(f'## 第 {i+1} 页\n\n{text}')
        
        result = '\n\n---\n\n'.join(full_text)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(result)
        
        print(f'转换完成！共 {len(pdf.pages)} 页')
        print(f'输出文件：{output_path}')
except Exception as e:
    print(f'错误：{e}')
