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

  describe('newly-schema\u2019d collections (formerly passthrough)', () => {
    it('validates collections that now have schemas', () => {
      const data = { studentName: 'Test', phone: '123' };
      expect(validateInput('admissions', data)).toEqual(data);
    });

    it('validates roles collection', () => {
      const data = { name: 'Editor', description: 'Can edit content' };
      expect(validateInput('roles', data)).toEqual(data);
    });

    it('homepage-sections requires a key', () => {
      // Bug #14: this collection used to bypass validation entirely. Now it
      // enforces a typed schema — an arbitrary { foo: 123 } payload must fail.
      expect(() => validateInput('homepage-sections', { foo: 123 })).toThrow();
      const valid = { key: 'hero', title: 'Welcome', order: 1, visible: true, status: 'published' as const };
      expect(validateInput('homepage-sections', valid)).toMatchObject({ key: 'hero', title: 'Welcome' });
    });

    it('site collection allows extra keys via passthrough but enforces shape', () => {
      const valid = { name: 'Metas', mission: 'Excellence', extraFutureField: 'ok' };
      expect(validateInput('site', valid)).toMatchObject({ name: 'Metas' });
      expect(() => validateInput('site', { name: 123 })).toThrow();
    });

    it('value-added-courses requires a title', () => {
      expect(() => validateInput('value-added-courses', { duration: '6 weeks' })).toThrow();
      const valid = { title: 'Sign Language', duration: '6 weeks' };
      expect(validateInput('value-added-courses', valid)).toMatchObject({ title: 'Sign Language' });
    });

    it('rejects entirely unknown collections', () => {
      expect(() => validateInput('not-a-collection', { foo: 'bar' })).toThrow();
    });
  });
});
