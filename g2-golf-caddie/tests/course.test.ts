import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  availableTeeNames,
  coursePar,
  findHole,
  parseCourse,
  selectTee,
  validateCourse,
} from '../src/core/course.js';
import { testCourse } from './fixtures.js';

const sampleJson = JSON.parse(
  readFileSync(new URL('../courses/sample-pine-hollow.json', import.meta.url), 'utf8'),
) as unknown;

describe('validateCourse', () => {
  it('accepts the bundled sample course', () => {
    expect(validateCourse(sampleJson)).toEqual([]);
  });

  it('rejects a non-object', () => {
    expect(validateCourse('nope')).toHaveLength(1);
  });

  it('requires id, name, version and holes', () => {
    const issues = validateCourse({});
    const paths = issues.map((issue) => issue.path);
    expect(paths).toContain('$.id');
    expect(paths).toContain('$.name');
    expect(paths).toContain('$.version');
    expect(paths).toContain('$.holes');
  });

  it('catches an out-of-range coordinate', () => {
    const course = structuredClone(sampleJson) as Record<string, any>;
    course.holes[0].green.center.lng = 999;
    const issues = validateCourse(course);
    expect(issues.some((issue) => issue.path.endsWith('green.center.lng'))).toBe(true);
  });

  it('catches a duplicate hole number', () => {
    const course = structuredClone(sampleJson) as Record<string, any>;
    course.holes[1].number = course.holes[0].number;
    expect(validateCourse(course).some((issue) => issue.message.includes('duplicate'))).toBe(
      true,
    );
  });

  it('rejects an impossible par', () => {
    const course = structuredClone(sampleJson) as Record<string, any>;
    course.holes[0].par = 9;
    expect(validateCourse(course).some((issue) => issue.path.endsWith('.par'))).toBe(true);
  });

  it('requires a green with all three points', () => {
    const course = structuredClone(sampleJson) as Record<string, any>;
    delete course.holes[0].green.back;
    expect(validateCourse(course).some((issue) => issue.path.includes('green.back'))).toBe(
      true,
    );
  });
});

describe('parseCourse', () => {
  it('throws a readable error listing every problem', () => {
    expect(() => parseCourse({ id: '', name: '', version: 2, holes: [] })).toThrow(
      /Invalid course file/,
    );
  });

  it('sorts holes by number', () => {
    const course = parseCourse({
      id: 'x',
      name: 'X',
      version: 1,
      holes: [
        {
          number: 2,
          par: 3,
          tees: [{ name: 'A', position: { lat: 1, lng: 1 } }],
          green: {
            front: { lat: 1, lng: 1 },
            center: { lat: 1, lng: 1 },
            back: { lat: 1, lng: 1 },
          },
        },
        {
          number: 1,
          par: 4,
          tees: [{ name: 'A', position: { lat: 1, lng: 1 } }],
          green: {
            front: { lat: 1, lng: 1 },
            center: { lat: 1, lng: 1 },
            back: { lat: 1, lng: 1 },
          },
        },
      ],
    });
    expect(course.holes.map((hole) => hole.number)).toEqual([1, 2]);
  });
});

describe('lookups', () => {
  const course = testCourse();

  it('finds a hole by number', () => {
    expect(findHole(course, 2)?.par).toBe(3);
    expect(findHole(course, 99)).toBeUndefined();
  });

  it('matches tees case-insensitively and falls back to the first', () => {
    const hole = course.holes[0]!;
    expect(selectTee(hole, 'blue')?.name).toBe('Blue');
    expect(selectTee(hole, 'Gold')?.name).toBe('Blue');
    expect(selectTee(hole)?.name).toBe('Blue');
  });

  it('only offers tee names present on every hole', () => {
    expect(availableTeeNames(course)).toEqual(['Blue']);
    const sample = parseCourse(sampleJson);
    expect(availableTeeNames(sample)).toEqual(['Blue', 'White', 'Forward']);
  });

  it('sums par across the course', () => {
    expect(coursePar(course)).toBe(7);
    expect(coursePar(parseCourse(sampleJson))).toBe(36);
  });
});
