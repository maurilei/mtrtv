// ============================================================
// MtrTV - EPG (Electronic Program Guide) Parser
// Parses XMLTV format EPG data
// ============================================================

import axios from 'axios';
import { parseString } from 'xml2js';
import { EpgProgram, EpgSource } from '../types';

/**
 * Fetch and parse EPG data from XMLTV source
 */
export const fetchAndParseEpg = async (
  source: EpgSource,
): Promise<EpgProgram[]> => {
  try {
    const response = await axios.get(source.url, {
      timeout: 60000,
      headers: {
        'User-Agent': 'MtrTV/1.0',
        'Accept-Encoding': 'gzip',
      },
      responseType: 'text',
    });

    return parseXmltvContent(response.data);
  } catch (error: any) {
    console.error('Error fetching EPG:', error.message);
    throw new Error(`Erro ao carregar EPG: ${error.message}`);
  }
};

/**
 * Parse XMLTV content string into EpgProgram array
 */
export const parseXmltvContent = (xmlContent: string): Promise<EpgProgram[]> => {
  return new Promise((resolve, reject) => {
    parseString(
      xmlContent,
      {
        explicitArray: false,
        ignoreAttrs: false,
        mergeAttrs: true,
        trim: true,
      },
      (err: any, result: any) => {
        if (err) {
          reject(new Error(`Erro ao processar XML do EPG: ${err.message}`));
          return;
        }

        const programs: EpgProgram[] = [];
        const tv = result?.tv;
        if (!tv || !tv.programme) {
          resolve(programs);
          return;
        }

        const programmeArray = Array.isArray(tv.programme)
          ? tv.programme
          : [tv.programme];

        programmeArray.forEach((prog: any, index: number) => {
          try {
            const startTime = parseXmltvDate(prog.start);
            const endTime = parseXmltvDate(prog.stop);

            if (!startTime || !endTime) return;

            const title = extractText(prog.title);
            const description = extractText(prog.desc);
            const category = extractText(prog.category);
            const icon = prog.icon?.src || undefined;

            programs.push({
              id: `epg_${prog.channel}_${index}_${startTime}`,
              channelId: prog.channel || '',
              title: title || 'Sem Título',
              description: description || undefined,
              startTime,
              endTime,
              category: category || undefined,
              icon,
              isNew: prog['new'] !== undefined,
              rating: extractRating(prog.rating),
              season: extractEpisodeNum(prog, 'season'),
              episode: extractEpisodeNum(prog, 'episode'),
            });
          } catch {
            // Skip malformed program entries
          }
        });

        resolve(programs);
      },
    );
  });
};

/**
 * Parse XMLTV date format (YYYYMMDDHHmmSS +HHMM) to Unix timestamp
 */
const parseXmltvDate = (dateStr: string | undefined): number | null => {
  if (!dateStr) return null;

  const cleaned = dateStr.replace(/\s+/g, ' ').trim();
  const match = cleaned.match(
    /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-]\d{4})?/,
  );

  if (!match) return null;

  const [, year, month, day, hour, minute, second = '00', offset] = match;
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${
    offset ? `${offset.substring(0, 3)}:${offset.substring(3)}` : 'Z'
  }`;

  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : date.getTime();
};

/**
 * Extract text content from XMLTV element
 */
const extractText = (element: any): string | undefined => {
  if (!element) return undefined;
  if (typeof element === 'string') return element;
  if (Array.isArray(element)) {
    const item = element[0];
    if (typeof item === 'string') return item;
    return item?._ || item?.['#text'] || undefined;
  }
  return element._ || element['#text'] || undefined;
};

/**
 * Extract rating from XMLTV rating element
 */
const extractRating = (rating: any): string | undefined => {
  if (!rating) return undefined;
  if (typeof rating === 'string') return rating;
  const value = rating.value;
  if (typeof value === 'string') return value;
  if (value?._) return value._;
  return undefined;
};

/**
 * Extract episode/season number from XMLTV episode-num element
 */
const extractEpisodeNum = (
  prog: any,
  type: 'season' | 'episode',
): number | undefined => {
  const episodeNum = prog['episode-num'];
  if (!episodeNum) return undefined;

  const nums = Array.isArray(episodeNum) ? episodeNum : [episodeNum];

  for (const num of nums) {
    const text = typeof num === 'string' ? num : num?._ || num?.['#text'];
    if (!text) continue;

    // xmltv_ns format: season.episode.part
    const parts = text.split('.');
    if (parts.length >= 2) {
      const value = type === 'season' ? parts[0] : parts[1];
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) return parsed + 1; // xmltv_ns is 0-based
    }
  }

  return undefined;
};

/**
 * Get current/next programs for a channel
 */
export const getCurrentAndNextPrograms = (
  programs: EpgProgram[],
  channelId: string,
  now: number = Date.now(),
): { current?: EpgProgram; next?: EpgProgram } => {
  const channelPrograms = programs
    .filter(p => p.channelId === channelId)
    .sort((a, b) => a.startTime - b.startTime);

  const current = channelPrograms.find(
    p => p.startTime <= now && p.endTime > now,
  );

  const next = current
    ? channelPrograms.find(p => p.startTime >= current.endTime)
    : channelPrograms.find(p => p.startTime > now);

  return { current, next };
};

/**
 * Get programs for a time range
 */
export const getProgramsForTimeRange = (
  programs: EpgProgram[],
  channelId: string,
  startTime: number,
  endTime: number,
): EpgProgram[] => {
  return programs
    .filter(
      p =>
        p.channelId === channelId &&
        p.endTime > startTime &&
        p.startTime < endTime,
    )
    .sort((a, b) => a.startTime - b.startTime);
};

/**
 * Calculate progress percentage for a program
 */
export const getProgramProgress = (program: EpgProgram): number => {
  const now = Date.now();
  if (now < program.startTime) return 0;
  if (now > program.endTime) return 100;

  const total = program.endTime - program.startTime;
  const elapsed = now - program.startTime;
  return Math.round((elapsed / total) * 100);
};
