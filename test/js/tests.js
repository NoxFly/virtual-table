/**
 * @typedef {Object} Contact
 * @property {number} id - Unique identifier for the contact.
 * @property {string} name - Name of the contact.
 * @property {string} email - Email address of the contact.
 * @property {string} phone - Phone number of the contact.
 * @property {string} address - Address of the contact.
 * @property {Contact[]} children - Array of child contacts.
 */

import { Test1 } from './tests/test1.js';
import { Test2 } from './tests/test2.js';
import { Test3 } from './tests/test3.js';


export default [
    Test1,
    Test2,
    Test3
];