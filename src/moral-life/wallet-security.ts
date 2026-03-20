import crypto from 'crypto';

/**
 * 钱包安全模块 - 提供加密、验证和安全存储功能
 */

// 加密算法配置
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  saltLength: 32,
  tagLength: 16,
  iterations: 100000,
  digest: 'sha256',
} as const;

// 安全常量
const SECURITY_CONSTANTS = {
  minPasswordLength: 8,
  maxPasswordLength: 128,
  minSecurityCodeLength: 6,
  maxSecurityCodeLength: 6,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15分钟
} as const;

/**
 * 派生加密密钥
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    password,
    salt,
    ENCRYPTION_CONFIG.iterations,
    ENCRYPTION_CONFIG.keyLength,
    ENCRYPTION_CONFIG.digest
  );
}

/**
 * 加密数据
 */
export function encrypt(data: string, password: string): string {
  const salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
  
  const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  // 组合: salt + iv + tag + encrypted
  const result = Buffer.concat([salt, iv, tag, encrypted]);
  return result.toString('base64');
}

/**
 * 解密数据
 */
export function decrypt(encryptedData: string, password: string): string {
  const data = Buffer.from(encryptedData, 'base64');
  
  const salt = data.slice(0, ENCRYPTION_CONFIG.saltLength);
  const iv = data.slice(ENCRYPTION_CONFIG.saltLength, ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength);
  const tag = data.slice(
    ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength,
    ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength
  );
  const encrypted = data.slice(ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength);
  
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * 生成安全的随机ID
 */
export function generateSecureId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString('hex');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * 生成密钥对
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  
  return { publicKey, privateKey };
}

/**
 * 哈希密码
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength).toString('hex');
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    ENCRYPTION_CONFIG.iterations,
    64,
    ENCRYPTION_CONFIG.digest
  ).toString('hex');
  
  return `${salt}:${hash}`;
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(
    password,
    salt,
    ENCRYPTION_CONFIG.iterations,
    64,
    ENCRYPTION_CONFIG.digest
  ).toString('hex');
  
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
}

/**
 * 验证安全码
 */
export function validateSecurityCode(code: string): boolean {
  const pattern = /^\d{6}$/;
  return pattern.test(code);
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} {
  if (password.length < SECURITY_CONSTANTS.minPasswordLength) {
    return {
      valid: false,
      strength: 'weak',
      message: `密码长度至少为 ${SECURITY_CONSTANTS.minPasswordLength} 位`,
    };
  }
  
  if (password.length > SECURITY_CONSTANTS.maxPasswordLength) {
    return {
      valid: false,
      strength: 'weak',
      message: `密码长度不能超过 ${SECURITY_CONSTANTS.maxPasswordLength} 位`,
    };
  }
  
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score < 2) {
    return {
      valid: true,
      strength: 'weak',
      message: '密码强度较弱，建议包含大小写字母、数字和特殊字符',
    };
  }
  
  if (score < 4) {
    return {
      valid: true,
      strength: 'medium',
      message: '密码强度中等',
    };
  }
  
  return {
    valid: true,
    strength: 'strong',
    message: '密码强度优秀',
  };
}

/**
 * 创建数字签名
 */
export function createSignature(data: string, privateKey: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

/**
 * 验证数字签名
 */
export function verifySignature(data: string, signature: string, publicKey: string): boolean {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, signature, 'base64');
}

/**
 * 安全的比较函数 - 防止时序攻击
 */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  if (bufA.length !== bufB.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * 登录尝试限制器
 */
class LoginAttemptLimiter {
  private attempts = new Map<string, { count: number; lockoutEnd: number }>();
  
  canAttempt(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return true;
    
    if (Date.now() < record.lockoutEnd) {
      return false;
    }
    
    return record.count < SECURITY_CONSTANTS.maxLoginAttempts;
  }
  
  recordAttempt(identifier: string, success: boolean): void {
    if (success) {
      this.attempts.delete(identifier);
      return;
    }
    
    const record = this.attempts.get(identifier) || { count: 0, lockoutEnd: 0 };
    record.count++;
    
    if (record.count >= SECURITY_CONSTANTS.maxLoginAttempts) {
      record.lockoutEnd = Date.now() + SECURITY_CONSTANTS.lockoutDuration;
    }
    
    this.attempts.set(identifier, record);
  }
  
  getLockoutTimeRemaining(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const remaining = record.lockoutEnd - Date.now();
    return Math.max(0, remaining);
  }
}

export const loginLimiter = new LoginAttemptLimiter();

// 导出安全常量
export { SECURITY_CONSTANTS, ENCRYPTION_CONFIG };
