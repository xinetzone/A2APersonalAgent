import fs from 'fs';
import path from 'path';

// 敏感信息的正则表达式模式
const sensitivePatterns = [
  // API密钥和令牌
  { pattern: /(api[_-]?key|api[_-]?secret|access[_-]?token|auth[_-]?token|bearer[_-]?token)\s*[:=]\s*['\"]([a-zA-Z0-9_\-]+)['\"]/gi, description: 'API密钥或令牌' },
  // 客户端ID和密钥
  { pattern: /(client[_-]?id|client[_-]?secret)\s*[:=]\s*['\"]([a-zA-Z0-9_\-]+)['\"]/gi, description: '客户端ID或密钥' },
  // 密码
  { pattern: /(password|pass|pwd)\s*[:=]\s*['\"]([a-zA-Z0-9_\-]+)['\"]/gi, description: '密码' },
  // 数据库连接字符串
  { pattern: /(connection[_-]?string|db[_-]?url)\s*[:=]\s*['\"]([^'\"]+)['\"]/gi, description: '数据库连接字符串' },
  // 环境变量中的敏感信息
  { pattern: /process\.env\.(SECONDME|AGENTPIT|ZHIHU)_[A-Z_]+/gi, description: '环境变量中的敏感信息' }
];

// 要排除的目录和文件
const excludePaths = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'out',
  'build',
  '_build',
  '.agents',
  '.secondme',
  '.claude',
  'scripts',
  'coverage',
  'logs',
  '.env',
  '.env.local',
  'package-lock.json'
];

// 要扫描的文件类型
const includeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.json'];

let findings = [];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    sensitivePatterns.forEach(({ pattern, description }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        findings.push({
          file: filePath,
          line: content.substring(0, match.index).split('\n').length,
          description,
          match: match[0].trim(),
          severity: match[0].toLowerCase().includes('secret') ? 'high' : 'medium'
        });
      }
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
  }
}

function scanDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(directory, file.name);
    
    // 检查是否需要排除
    if (excludePaths.some(exclude => fullPath.includes(exclude))) {
      return;
    }
    
    if (file.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.isFile() && includeExtensions.some(ext => file.name.endsWith(ext))) {
      scanFile(fullPath);
    }
  });
}

// 开始扫描
console.log('Starting security scan...');
console.log('Scanning for sensitive information...');

scanDirectory('.');

// 输出结果
console.log('\n=== Security Scan Results ===');
if (findings.length === 0) {
  console.log('No sensitive information found.');
} else {
  console.log(`Found ${findings.length} potential sensitive information issues:`);
  console.log('');
  
  findings.forEach((finding, index) => {
    console.log(`${index + 1}. [${finding.severity.toUpperCase()}] ${finding.description}`);
    console.log(`   File: ${finding.file}`);
    console.log(`   Line: ${finding.line}`);
    console.log(`   Match: ${finding.match}`);
    console.log('');
  });
  
  console.log('=== Summary ===');
  console.log(`Total findings: ${findings.length}`);
  console.log(`High severity: ${findings.filter(f => f.severity === 'high').length}`);
  console.log(`Medium severity: ${findings.filter(f => f.severity === 'medium').length}`);
}

console.log('\nSecurity scan completed.');
