
interface AppointmentData {
    client_name: string;
    professional_name: string;
    date: string;
    time: string;
    location: string;
    phone: string;
}

export const generateWhatsAppLink = (template: string, data: AppointmentData) => {
    const message = template
        .replace(/{client_name}/g, data.client_name)
        .replace(/{professional_name}/g, data.professional_name)
        .replace(/{date}/g, data.date)
        .replace(/{time}/g, data.time)
        .replace(/{location}/g, data.location);

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = data.phone.replace(/\D/g, '');

    return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
};
