export type Contact = {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    children: Contact[];
};