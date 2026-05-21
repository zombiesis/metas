import { describe, it, expect } from 'vitest';
import { validateInput } from '@/lib/validation';

describe('Zod Validation Schemas', () => {
  describe('users', () => {
    it('accepts valid user data', () => {
      const data = { username: 'admin', email: 'a@b.com', status: 'active' };
      expect(() => validateInput('users', data)).not.toThrow();
    });

    it('rejects short username', () => {
      expect(() => validateInput('users', { username: 'ab' })).toThrow();
    });

    it('rejects invalid email', () => {
      expect(() => validateInput('users', { username: 'admin', email: 'not-email' })).toThrow();
    });

    it('rejects invalid status', () => {
      expect(() => validateInput('users', { username: 'admin', status: 'bogus' })).toThrow();
    });
  });

  describe('pages', () => {
    it('accepts valid page data', () => {
      const data = { title: 'About Us', body: '<p>Content</p>', status: 'draft' };
      expect(() => validateInput('pages', data)).not.toThrow();
    });

    it('rejects empty title', () => {
      expect(() => validateInput('pages', { title: '' })).toThrow();
    });

    it('rejects invalid status', () => {
      expect(() => validateInput('pages', { title: 'Test', status: 'invalid' })).toThrow();
    });
  });

  describe('programs', () => {
    it('accepts valid program data', () => {
      const data = { title: 'BBA', category: 'Management', status: 'published' };
      expect(() => validateInput('programs', data)).not.toThrow();
    });

    it('rejects missing title', () => {
      expect(() => validateInput('programs', { category: 'Test' })).toThrow();
    });
  });

  describe('passthrough collections', () => {
    it('validates collections that now have schemas', () => {
      const data = { studentName: 'Test', phone: '123' };
      expect(validateInput('admissions', data)).toEqual(data);
    });

    it('validates roles collection', () => {
      const data = { name: 'Editor', description: 'Can edit content' };
      expect(validateInput('roles', data)).toEqual(data);
    });

    it('passes through collections without schemas (e.g. homepage-sections)', () => {
      const data = { anything: 'goes', foo: 123 };
      expect(validateInput('homepage-sections', data)).toEqual(data);
    });
  });
});
