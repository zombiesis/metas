import { cache } from 'react';
import { getBranchTheme, type BranchTheme } from '@/lib/theme';
import { getCurrentBranchId } from '@/lib/tenant';
import { getSiteSettings, getHomepageSections, getPrograms, getNotices, getDocuments, getFaculty, type SiteSettings, type HomepageSection, type Program, type Notice, type AccreditationDocument, type FacultyMember } from '@/lib/cms-db';

/**
 * Request-level caching using React's cache() function.
 * These are deduplicated within a single server render — no redundant DB calls.
 */

export const cachedBranchTheme = cache((): Promise<BranchTheme> => getBranchTheme());
export const cachedBranchId = cache((): Promise<string | null> => getCurrentBranchId());
export const cachedSiteSettings = cache((): Promise<SiteSettings> => getSiteSettings());
export const cachedHomepageSections = cache((): Promise<HomepageSection[]> => getHomepageSections());
export const cachedPrograms = cache((): Promise<Program[]> => getPrograms());
export const cachedNotices = cache((): Promise<Notice[]> => getNotices());
export const cachedDocuments = cache((): Promise<AccreditationDocument[]> => getDocuments());
export const cachedFaculty = cache((): Promise<FacultyMember[]> => getFaculty());
