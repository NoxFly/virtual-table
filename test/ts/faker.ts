import { Contact } from "./types";

export function generateRandomContact(): Contact {
    return {
        id: Math.floor(Math.random() * 1000),
        name: "toto",
        email: "toto@gmail.com",
        phone: "00 00 00 00 00",
        address: "1.00000094 boulevard du javascript",
        children: Math.random() > .33 ? [] : Array.from({ length: Math.floor(Math.random() * 5) }, generateRandomContact),
    };
}

export function generateRandomContacts(count: number): Contact[] {
    const contacts: Contact[] = [];

    for (let i = 0; i < count; i++) {
        contacts.push(generateRandomContact());
    }

    return contacts;
}