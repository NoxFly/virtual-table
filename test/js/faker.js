/**
 * @typedef {Object} Contact
 * @property {number} id - Unique identifier for the contact.
 * @property {string} name - Name of the contact.
 * @property {string} email - Email address of the contact.
 * @property {string} phone - Phone number of the contact.
 * @property {string} address - Address of the contact.
 * @property {Contact[]} children - Array of child contacts.
 */

/**
 * 
 * @returns {Contact} A randomly generated contact object.
 */
export function generateRandomContact() {
    return {
        id: Math.floor(Math.random() * 1000),
        name: "toto",
        email: "toto@gmail.com",
        phone: "00 00 00 00 00",
        address: "1.00000094 boulevard du javascript",
        children: Math.random() > .33 ? [] : Array.from({ length: Math.floor(Math.random() * 5) }, generateRandomContact),
    };
}

/**
 * 
 * @param {number} count 
 * @returns {Contact[]} An array of randomly generated contact objects.
 */
export function generateRandomContacts(count) {
    /** @type {Contact[]} */
    const contacts = [];

    for (let i = 0; i < count; i++) {
        contacts.push(generateRandomContact());
    }

    return contacts;
}