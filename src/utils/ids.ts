/**
 * @file Unique ID generator.
 *
 * Uses nanoid (10 chars) for all entity IDs — exercises, slots, sessions, sets, metrics.
 * Short enough for localStorage keys, collision-resistant enough for a single-user app.
 */

import { nanoid } from 'nanoid';

/** Generate a 10-character unique ID for any entity */
export const generateId = () => nanoid(10);
