import type { Locale } from "@/lib/i18n/config";

export type FaqEntry = { question: string; answer: string };

/**
 * FAQ copy lives here rather than in the dictionary because the same entries
 * feed both the accordion component and the `FAQPage` structured data — keeping
 * them in one place guarantees the visible text and the marked-up text match.
 */
export const FAQS: Record<Locale, FaqEntry[]> = {
  fr: [
    {
      question: "Comment obtenir un tarif ?",
      answer:
        "Remplissez le formulaire de demande de devis, ou appelez-nous ou écrivez-nous directement sur WhatsApp. Nous revenons vers vous avec un tarif adapté à votre trajet.",
    },
    {
      question: "La demande de devis est-elle gratuite ?",
      answer:
        "Oui. La demande est gratuite et ne vous engage à rien. Aucun paiement n'est demandé en ligne.",
    },
    {
      question: "Une demande confirme-t-elle la réservation ?",
      answer:
        "Non. L'envoi du formulaire enregistre votre demande avec une référence. Le trajet, le tarif et l'horaire ne sont confirmés qu'après un échange direct avec vous.",
    },
    {
      question: "Sous quel délai vais-je obtenir une réponse ?",
      answer:
        "Nous traitons les demandes dans l'ordre de réception. Si votre départ est imminent, appelez-nous ou utilisez WhatsApp : c'est le moyen le plus rapide d'obtenir un tarif.",
    },
    {
      question: "Faut-il réserver à l'avance ?",
      answer:
        "Nous le recommandons, en particulier pour les transferts d'aéroport, les week-ends et les trajets en heure de pointe. Un délai supplémentaire nous permet de préparer un véhicule adapté au nombre de passagers et de bagages.",
    },
    {
      question:
        "Quelles informations fournir pour un transfert d'aéroport ?",
      answer:
        "Le numéro de vol et l'heure prévue de départ ou d'arrivée. Nous n'utilisons pas de suivi de vol automatique : signalez-nous vous-même tout retard afin que nous ajustions le rendez-vous avec vous.",
    },
    {
      question: "Proposez-vous des trajets longue distance ?",
      answer:
        "Oui. Décrivez votre destination, vos dates et le nombre de passagers. Nous étudions le trajet et vous transmettons un devis clair.",
    },
    {
      question: "Comment puis-je vous contacter ?",
      answer:
        "Par téléphone, par WhatsApp, via le formulaire de contact ou par e-mail. Tous les moyens de nous joindre sont indiqués sur la page Contact.",
    },
  ],
  en: [
    {
      question: "How do I get a price?",
      answer:
        "Fill in the quote request form, or call us or message us directly on WhatsApp. We come back to you with a price suited to your journey.",
    },
    {
      question: "Is the quote request free?",
      answer:
        "Yes. The request is free and carries no obligation. No payment is taken online.",
    },
    {
      question: "Does a request confirm the booking?",
      answer:
        "No. Sending the form records your request with a reference. The journey, the price and the time are only confirmed after speaking with you directly.",
    },
    {
      question: "How quickly will I get a reply?",
      answer:
        "We handle requests in the order they arrive. If your departure is imminent, call us or use WhatsApp: it is the fastest way to get a price.",
    },
    {
      question: "Should I book in advance?",
      answer:
        "We recommend it, particularly for airport transfers, weekends and journeys at peak times. Extra notice lets us prepare a vehicle suited to your number of passengers and bags.",
    },
    {
      question: "What should I provide for an airport transfer?",
      answer:
        "The flight number and the scheduled departure or arrival time. We do not use automatic flight tracking: tell us about any delay yourself so we can adjust the time with you.",
    },
    {
      question: "Do you offer long-distance journeys?",
      answer:
        "Yes. Describe your destination, your dates and the number of passengers. We review the journey and send you a clear quote.",
    },
    {
      question: "How can I reach you?",
      answer:
        "By phone, on WhatsApp, through the contact form or by email. Every way to reach us is listed on the Contact page.",
    },
  ],
};