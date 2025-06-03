/**
 * @typedef {Object} Contact
 * @property {number} id - Unique identifier for the contact.
 * @property {string} name - Name of the contact.
 * @property {string} email - Email address of the contact.
 * @property {string} phone - Phone number of the contact.
 * @property {string} address - Address of the contact.
 * @property {Contact[]} children - Array of child contacts.
 */


function randomContactName() {
    const names = [
        "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hannah", "Ian", "Jack",
        "Kathy", "Liam", "Mia", "Noah", "Olivia", "Paul", "Quinn", "Rita", "Sam", "Tina",
        "Ursula", "Victor", "Wendy", "Xander", "Yara", "Zane", "Aaron", "Bella", "Carter",
        "Diana", "Ethan", "Fiona", "George", "Holly", "Isaac", "Jasmine", "Kevin", "Laura",
        "Michael", "Nicole", "Oscar", "Penny", "Quincy", "Rachel", "Steve", "Tara", "Ulysses",
    ];
    return names[Math.floor(Math.random() * names.length)];
}

function randomEmail(name) {
    const domains = ["example.com", "test.com", "demo.com", "sample.com"];
    return `${name.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function randomPhone() {
    return `0${Math.floor(Math.random() * 6)}`
        + ` ${Math.floor(Math.random() * 100)}`
        + ` ${Math.floor(Math.random() * 100)}`
        + ` ${Math.floor(Math.random() * 100)}`
        + ` ${Math.floor(Math.random() * 100)}`;
}

function randomAddress() {
    const streets = ["1st Ave", "2nd Ave", "3rd Ave", "4th Ave", "5th Ave"];
    const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];
    return `${Math.floor(Math.random() * 1000)} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}`;
}

/**
 * 
 * @returns {Contact} A randomly generated contact object.
 */
export function generateRandomContact() {
    const name = randomContactName();
    const email = randomEmail(name);
    const phone = randomPhone();
    const address = randomAddress();

    const children = Math.random() > .33
        ? []
        : Array.from({
            length: Math.floor(Math.random() * 5)
        }, generateRandomContact)

    return {
        id: Math.floor(Math.random() * 1000),
        name,
        email,
        phone,
        address,
        children,
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