import {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  validateSecurityCode,
  validatePasswordStrength,
  generateSecureId,
  generateKeyPair,
  createSignature,
  verifySignature,
  secureCompare,
  loginLimiter,
  SECURITY_CONSTANTS,
} from './wallet-security';

describe('Wallet Security Module', () => {
  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'sensitive wallet data';
      const password = 'strong-password-123';
      
      const encrypted = encrypt(originalData, password);
      expect(encrypted).not.toBe(originalData);
      expect(typeof encrypted).toBe('string');
      
      const decrypted = decrypt(encrypted, password);
      expect(decrypted).toBe(originalData);
    });

    it('should produce different ciphertexts for same data', () => {
      const data = 'test data';
      const password = 'password';
      
      const encrypted1 = encrypt(data, password);
      const encrypted2 = encrypt(data, password);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same data
      expect(decrypt(encrypted1, password)).toBe(data);
      expect(decrypt(encrypted2, password)).toBe(data);
    });

    it('should throw error for wrong password', () => {
      const data = 'test data';
      const encrypted = encrypt(data, 'correct-password');
      
      expect(() => decrypt(encrypted, 'wrong-password')).toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', () => {
      const password = 'my-secure-password';
      const hashed = hashPassword(password);
      
      expect(hashed).toContain(':');
      expect(typeof hashed).toBe('string');
    });

    it('should verify correct password', () => {
      const password = 'my-secure-password';
      const hashed = hashPassword(password);
      
      expect(verifyPassword(password, hashed)).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'my-secure-password';
      const hashed = hashPassword(password);
      
      expect(verifyPassword('wrong-password', hashed)).toBe(false);
    });

    it('should produce different hashes for same password', () => {
      const password = 'same-password';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      
      // But both should verify correctly
      expect(verifyPassword(password, hash1)).toBe(true);
      expect(verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('Security Code Validation', () => {
    it('should validate correct 6-digit code', () => {
      expect(validateSecurityCode('123456')).toBe(true);
      expect(validateSecurityCode('000000')).toBe(true);
      expect(validateSecurityCode('999999')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(validateSecurityCode('12345')).toBe(false); // Too short
      expect(validateSecurityCode('1234567')).toBe(false); // Too long
      expect(validateSecurityCode('12345a')).toBe(false); // Contains letter
      expect(validateSecurityCode('123 45')).toBe(false); // Contains space
      expect(validateSecurityCode('')).toBe(false); // Empty
      expect(validateSecurityCode('abcdef')).toBe(false); // All letters
    });
  });

  describe('Password Strength Validation', () => {
    it('should reject short passwords', () => {
      const result = validatePasswordStrength('1234567');
      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
    });

    it('should accept weak passwords with warning', () => {
      const result = validatePasswordStrength('password');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('weak');
    });

    it('should identify medium strength passwords', () => {
      const result = validatePasswordStrength('Password1');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('should identify strong passwords', () => {
      const result = validatePasswordStrength('Password1!');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'a'.repeat(129);
      const result = validatePasswordStrength(longPassword);
      expect(result.valid).toBe(false);
    });
  });

  describe('Secure ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = generateSecureId('wallet');
      const id2 = generateSecureId('wallet');
      
      expect(id1).not.toBe(id2);
      expect(id1.startsWith('wallet-')).toBe(true);
      expect(id2.startsWith('wallet-')).toBe(true);
    });

    it('should generate IDs with correct format', () => {
      const id = generateSecureId('test');
      const parts = id.split('-');
      
      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(parts[0]).toBe('test');
    });
  });

  describe('Key Pair Generation', () => {
    it('should generate valid key pair', () => {
      const { publicKey, privateKey } = generateKeyPair();
      
      expect(publicKey).toBeDefined();
      expect(privateKey).toBeDefined();
      expect(publicKey.includes('BEGIN PUBLIC KEY')).toBe(true);
      expect(privateKey.includes('BEGIN PRIVATE KEY')).toBe(true);
    });

    it('should generate unique key pairs', () => {
      const pair1 = generateKeyPair();
      const pair2 = generateKeyPair();
      
      expect(pair1.publicKey).not.toBe(pair2.publicKey);
      expect(pair1.privateKey).not.toBe(pair2.privateKey);
    });
  });

  describe('Digital Signatures', () => {
    it('should create and verify signature', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const data = 'transaction data';
      
      const signature = createSignature(data, privateKey);
      expect(typeof signature).toBe('string');
      
      const isValid = verifySignature(data, signature, publicKey);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const { publicKey: wrongPublicKey } = generateKeyPair();
      const data = 'transaction data';
      
      const signature = createSignature(data, privateKey);
      const isValid = verifySignature(data, signature, wrongPublicKey);
      expect(isValid).toBe(false);
    });

    it('should reject tampered data', () => {
      const { publicKey, privateKey } = generateKeyPair();
      const data = 'transaction data';
      
      const signature = createSignature(data, privateKey);
      const isValid = verifySignature('tampered data', signature, publicKey);
      expect(isValid).toBe(false);
    });
  });

  describe('Secure Compare', () => {
    it('should return true for equal strings', () => {
      expect(secureCompare('test', 'test')).toBe(true);
      expect(secureCompare('longer-string-test', 'longer-string-test')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(secureCompare('test', 'Test')).toBe(false);
      expect(secureCompare('test', 'test ')).toBe(false);
      expect(secureCompare('abc', 'def')).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(secureCompare('short', 'longer-string')).toBe(false);
    });
  });

  describe('Login Attempt Limiter', () => {
    beforeEach(() => {
      // Reset limiter state
      loginLimiter.recordAttempt('test-user', true);
    });

    it('should allow initial attempts', () => {
      expect(loginLimiter.canAttempt('new-user')).toBe(true);
    });

    it('should block after max attempts', () => {
      const userId = 'test-user';
      
      for (let i = 0; i < SECURITY_CONSTANTS.maxLoginAttempts; i++) {
        loginLimiter.recordAttempt(userId, false);
      }
      
      expect(loginLimiter.canAttempt(userId)).toBe(false);
    });

    it('should reset on successful login', () => {
      const userId = 'test-user';
      
      for (let i = 0; i < 3; i++) {
        loginLimiter.recordAttempt(userId, false);
      }
      
      loginLimiter.recordAttempt(userId, true);
      expect(loginLimiter.canAttempt(userId)).toBe(true);
    });

    it('should report lockout time remaining', () => {
      const userId = 'test-user';
      
      for (let i = 0; i < SECURITY_CONSTANTS.maxLoginAttempts; i++) {
        loginLimiter.recordAttempt(userId, false);
      }
      
      const remaining = loginLimiter.getLockoutTimeRemaining(userId);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(SECURITY_CONSTANTS.lockoutDuration);
    });
  });

  describe('Security Constants', () => {
    it('should have correct min password length', () => {
      expect(SECURITY_CONSTANTS.minPasswordLength).toBe(8);
    });

    it('should have correct max password length', () => {
      expect(SECURITY_CONSTANTS.maxPasswordLength).toBe(128);
    });

    it('should have correct security code length', () => {
      expect(SECURITY_CONSTANTS.minSecurityCodeLength).toBe(6);
      expect(SECURITY_CONSTANTS.maxSecurityCodeLength).toBe(6);
    });

    it('should have correct max login attempts', () => {
      expect(SECURITY_CONSTANTS.maxLoginAttempts).toBe(5);
    });

    it('should have correct lockout duration', () => {
      expect(SECURITY_CONSTANTS.lockoutDuration).toBe(15 * 60 * 1000);
    });
  });
});
