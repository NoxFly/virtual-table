/**
 * @typedef {Object} Contact
 * @property {number} id - Unique identifier for the contact.
 * @property {string} name - Name of the contact.
 * @property {string} email - Email address of the contact.
 * @property {string} phone - Phone number of the contact.
 * @property {string} address - Address of the contact.
 * @property {string} company - Company name of the contact.
 * @property {string} jobTitle - Job title of the contact.
 * @property {string} birthday - Birthday of the contact in ISO format.
 * @property {string} website - Website URL of the contact.
 * @property {string} num - An incremental padded number as string.
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

function randomCompany() {
    const companies = [
        "Tech Solutions", "Innovatech", "Global Corp", "Future Enterprises",
        "Creative Minds", "Synergy Systems", "Visionary Ventures", "Dynamic Dynamics",
        "NextGen Technologies", "Pioneering Partners"
    ];
    return companies[Math.floor(Math.random() * companies.length)];
}

function randomJobTitle() {
    const jobTitles = [
        "Software Engineer", "Product Manager", "Data Scientist", "UX Designer",
        "Marketing Specialist", "Sales Executive", "Project Coordinator", "Business Analyst",
        "Customer Support Representative", "HR Manager"
    ];
    return jobTitles[Math.floor(Math.random() * jobTitles.length)];
}

function randomBirthday() {
    const year = Math.floor(Math.random() * 50) + 1970; // Random year between 1970 and 2020
    const month = Math.floor(Math.random() * 12) + 1; // Random month between 1 and 12
    const day = Math.floor(Math.random() * 28) + 1; // Random day between 1 and 28 (to avoid month-end issues)
    return new Date(year, month - 1, day).toISOString().split('T')[0]; // Return in YYYY-MM-DD format
}

function randomWebsite() {
    const domains = ["example.com", "test.com", "demo.com", "sample.com"];
    return `https://${domains[Math.floor(Math.random() * domains.length)]}`;
}


function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


/**
 *
 * @returns {Contact} A randomly generated contact object.
 */
export function generateRandomContact(withChildren = true) {
    const name = randomContactName();
    const email = randomEmail(name);
    const phone = randomPhone();
    const address = randomAddress();
    const company = randomCompany();
    const jobTitle = randomJobTitle();
    const birthday = randomBirthday();
    const website = randomWebsite();

    const children = !withChildren || Math.random() > .33
        ? []
        : Array.from({
            length: Math.floor(Math.random() * 5)
        }, generateRandomContact)

    return {
        id: randomUUID(),
        name,
        email,
        phone,
        address,
        children,
        company,
        jobTitle,
        birthday,
        website,
        num: "00000001.00000002.00000003",
    };
}

/**
 *
 * @param {number} count
 * @returns {Contact[]} An array of randomly generated contact objects.
 */
export function generateRandomContacts(count, withChildren = true) {
    /** @type {Contact[]} */
    const contacts = [];

    for (let i = 0; i < count; i++) {
        contacts.push(generateRandomContact(withChildren));
    }

    return contacts;
}
