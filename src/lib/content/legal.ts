import type { Locale } from "@/lib/i18n/config";

export type LegalSection = { heading: string; paragraphs: string[]; list?: string[] };

/**
 * Legal page copy.
 *
 * These are deliberately written as *templates*: the company identity fields
 * are pulled from `site_settings` where the owner has filled them in, and the
 * pages render a prominent "model to be completed" banner. Nothing here
 * asserts that the site is legally compliant — only the owner and their lawyer
 * can make that statement.
 */
export const LEGAL_CONTENT: Record<
  Locale,
  Record<"mentions" | "privacy" | "cookies", { title: string; intro: string; sections: LegalSection[] }>
> = {
  fr: {
    mentions: {
      title: "Mentions légales",
      intro:
        "Informations relatives à l'éditeur et à l'hébergement du site. Les champs entre crochets doivent être complétés par l'exploitant.",
      sections: [
        {
          heading: "Éditeur du site",
          paragraphs: [
            "Le site est édité par : [Dénomination sociale ou nom du propriétaire], exploitant l'activité de taxi sous le nom « Taxi Nord Lille ».",
            "Siège social : [adresse complète]",
            "Téléphone : [numéro de téléphone]",
            "Adresse électronique : [adresse électronique]",
            "Numéro SIRET : [numéro SIRET] — RCS Lille Métropole : [numéro RCS]",
            "Numéro de TVA intracommunautaire : [numéro de TVA, si applicable]",
            "Assurance responsabilité civile professionnelle : [nom de l'assureur, numéro de contrat]",
            "Directeur de la publication : [nom du directeur de la publication]",
          ],
        },
        {
          heading: "Hébergement",
          paragraphs: [
            "Le site est hébergé par : [nom et adresse de l'hébergeur]. Pour plus d'informations : [site de l'hébergeur].",
          ],
        },
        {
          heading: "Activité de taxi",
          paragraphs: [
            "L'activité de transport de personnes par taxi est exercée conformément à la réglementation applicable. Les informations relatives à la carte professionnelle de l'exploitant sont communiquées sur demande.",
            "Ce site est un outil de présentation et de demande de devis. Il ne constitue pas un service de réservation en ligne et n'assure aucune vente à distance.",
          ],
        },
        {
          heading: "Propriété intellectuelle",
          paragraphs: [
            "L'ensemble des éléments du site (textes, visuels, identité visuelle, code) est protégé par le droit d'auteur. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite.",
            "La marque et le logo présents sur le site appartiennent à leur titulaire.",
          ],
        },
        {
          heading: "Responsabilité",
          paragraphs: [
            "L'exploitant s'efforce d'assurer l'exactitude des informations publiées, mais ne peut garantir leur exhaustivité à chaque instant. Les horaires, tarifs et disponibilités sont communiqués à titre indicatif et confirmés directement lors de chaque demande.",
            "Les demandes envoyées via ce site ne valent pas confirmation d'un trajet ni acceptation d'un devis.",
          ],
        },
        {
          heading: "Médiation et droit applicable",
          paragraphs: [
            "Tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation afin de régler un litige : [nom et coordonnées du médiateur désigné].",
            "Le droit français est seul applicable. À défaut de résolution amiable, les tribunaux français sont seuls compétents.",
          ],
        },
      ],
    },

    privacy: {
      title: "Politique de confidentialité",
      intro:
        "Cette page explique quelles données personnelles sont collectées sur ce site, pourquoi, combien de temps elles sont conservées et quels sont vos droits.",
      sections: [
        {
          heading: "Responsable du traitement",
          paragraphs: [
            "Le responsable du traitement est [Dénomination sociale ou nom], exploitant « Taxi Nord Lille ». Contact : [adresse électronique].",
          ],
        },
        {
          heading: "Données collectées",
          paragraphs: [
            "Ce site ne fonctionne pas avec de compte utilisateur ni avec de cookie publicitaire. Les données sont collectées uniquement lorsque vous les saisissez vous-même dans un formulaire.",
          ],
          list: [
            "Formulaire de demande de devis : nom et prénom, numéro de téléphone, adresse électronique (facultative), adresses de départ et de destination, date et heure de départ, éventuel retour, nombre de passagers, numéro de vol ou de train (facultatif), informations relatives aux bagages ou besoins particuliers (facultatives), message complémentaire (facultatif).",
            "Formulaire de contact : nom et prénom, adresse électronique (facultative), numéro de téléphone (facultatif), objet et contenu du message.",
          ],
        },
        {
          heading: "Finalités et base légale",
          paragraphs: [
            "Ces données servent uniquement à traiter votre demande : vous recontacter, établir un devis et organiser votre trajet. Elles sont conservées par l'exploitant pour la seule durée nécessaire au suivi de la demande et à la relation commerciale, puis supprimées ou anonymisées.",
          ],
          list: [
            "La base légale est votre consentement, recueilli via la case à cocher du formulaire, ainsi que les mesures précontractuelles prises à votre demande.",
            "La durée de conservation est définie dans les paramètres du site et peut être modifiée par l'exploitant. Une valeur indicative de [24] mois est appliquée par défaut.",
          ],
        },
        {
          heading: "Destinataires",
          paragraphs: [
            "Vos données ne sont ni vendues ni louées. Elles sont accessibles au seul exploitant du site et, le cas échéant, au prestataire d'envoi d'e-mails et au fournisseur de messagerie WhatsApp utilisés pour vous répondre. Aucun transfert à des tiers à des fins commerciales n'est réalisé.",
          ],
        },
        {
          heading: "Vos droits",
          paragraphs: [
            "Conformément au Règlement général sur la protection des données, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données, ainsi que du droit de retirer votre consentement à tout moment.",
            "Pour exercer ces droits, contactez [adresse électronique] ou [numéro de téléphone]. Vous pouvez également introduire une réclamation auprès de l'autorité de contrôle : Commission nationale de l'informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "La consultation de ce site ne dépose aucun cookie publicitaire, aucun traceur de mesure d'audience tiers et aucune technologie de suivi. La page « Gestion des cookies » détaille ce qui est éventuellement utilisé, notamment la session d'administration, qui est un cookie strictement nécessaire au fonctionnement du panneau privé.",
          ],
        },
      ],
    },

    cookies: {
      title: "Gestion des cookies",
      intro:
        "Ce site est conçu pour fonctionner sans publicité ciblée ni mesure d'audience tierce. Cette page décrit précisément ce qui est déposé sur votre navigateur.",
      sections: [
        {
          heading: "Cookies strictement nécessaires",
          paragraphs: [
            "Un seul cookie est déposé : un cookie de session réservé à l'espace d'administration du site, qui maintient la connexion de l'administrateur. Il est de nature strictement fonctionnelle, expire après une période limitée et n'est jamais utilisé à des fins de suivi ou de publicité.",
            "Ce cookie n'est créé que si vous vous connectez vous-même au panneau d'administration.",
          ],
        },
        {
          heading: "Absence de traceurs publicitaires",
          paragraphs: [
            "Ce site n'utilise aucun cookie publicitaire, aucun pixel de réseau social et aucun traceur de mesure d'audience tiers. Aucun outil d'analyse comportementale n'y est intégré.",
          ],
        },
        {
          heading: "Stockage local",
          paragraphs: [
            "Une valeur temporaire peut être enregistrée dans le stockage de session de votre navigateur lorsque vous commencez à remplir le formulaire de devis depuis la page d'accueil. Elle sert uniquement à reporter vos premières saisies dans le formulaire complet, est effacée dès l'envoi ou la fermeture de l'onglet, et n'est transmise à aucun serveur.",
          ],
        },
        {
          heading: "Si cette evolves",
          paragraphs: [
            "Toute évolution du site entraînant l'ajout d'un cookie ou d'un traceur non strictement nécessaire fera l'objet d'une mise à jour de cette page et, le cas échéant, d'un bandeau de consentement.",
          ],
        },
      ],
    },
  },

  en: {
    mentions: {
      title: "Legal notice",
      intro:
        "Information about the publisher and host of this website. Fields in brackets must be completed by the operator.",
      sections: [
        {
          heading: "Website publisher",
          paragraphs: [
            "This website is published by: [company name or owner's name], operating a taxi business under the name \"Taxi Nord Lille\".",
            "Registered office: [full address]",
            "Phone: [phone number]",
            "Email: [email address]",
            "SIRET number: [SIRET] — Lille Métropole RCS: [RCS number]",
            "EU VAT number: [VAT number, if applicable]",
            "Professional liability insurance: [insurer name, policy number]",
            "Publication director: [name of the publication director]",
          ],
        },
        {
          heading: "Hosting",
          paragraphs: ["The website is hosted by: [host name and address]. More information: [host website]."],
        },
        {
          heading: "Taxi activity",
          paragraphs: [
            "Passenger transport by taxi is carried out in accordance with the applicable regulations. Details of the operator's professional licence are provided on request.",
            "This website is a presentation and quote-request tool. It is not an online booking service and involves no distance selling.",
          ],
        },
        {
          heading: "Intellectual property",
          paragraphs: [
            "All elements of the website (texts, visuals, visual identity, code) are protected by copyright. Any total or partial reproduction or representation without prior written authorisation is prohibited.",
            "The brand and logo shown on the site belong to their owner.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "The operator endeavours to ensure the accuracy of published information but cannot guarantee its completeness at any given moment. Opening hours, prices and availability are provided for guidance and are confirmed directly with each request.",
            "Requests sent through this website do not constitute a confirmed journey or acceptance of a quote.",
          ],
        },
        {
          heading: "Mediation and applicable law",
          paragraphs: [
            "Any consumer has the right to use a consumer mediator free of charge to resolve a dispute: [name and contact details of the appointed mediator].",
            "French law alone applies. Failing amicable resolution, the French courts have sole jurisdiction.",
          ],
        },
      ],
    },

    privacy: {
      title: "Privacy policy",
      intro:
        "This page explains which personal data is collected on this website, why, how long it is kept, and what your rights are.",
      sections: [
        {
          heading: "Data controller",
          paragraphs: [
            "The data controller is [company name or name], operating \"Taxi Nord Lille\". Contact: [email address].",
          ],
        },
        {
          heading: "Data collected",
          paragraphs: [
            "This website has no user accounts and no advertising cookies. Data is collected only when you enter it yourself in a form.",
          ],
          list: [
            "Quote request form: full name, phone number, email address (optional), pick-up and destination addresses, departure date and time, return journey if any, number of passengers, flight or train number (optional), luggage or special requirements (optional), additional message (optional).",
            "Contact form: full name, email address (optional), phone number (optional), subject and message content.",
          ],
        },
        {
          heading: "Purposes and legal basis",
          paragraphs: [
            "This data is used only to handle your request: to contact you, prepare a quote and organise your journey. The operator keeps it for as long as is needed to follow up the request and the business relationship, after which it is deleted or anonymised.",
          ],
          list: [
            "The legal basis is your consent, collected through the form checkbox, together with pre-contractual measures taken at your request.",
            "The retention period is set in the website settings and can be changed by the operator. A default indicative period of [24] months is applied.",
          ],
        },
        {
          heading: "Recipients",
          paragraphs: [
            "Your data is neither sold nor rented. It is accessible only to the website operator and, where applicable, to the email delivery provider and WhatsApp messaging provider used to reply to you. No transfer to third parties for commercial purposes takes place.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "Under the General Data Protection Regulation, you have the right of access, rectification, erasure, restriction, objection and portability of your data, as well as the right to withdraw consent at any time.",
            "To exercise these rights, contact [email address] or [phone number]. You may also lodge a complaint with the supervisory authority: Commission nationale de l'informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "Browsing this website sets no advertising cookie, no third-party analytics tracker and no tracking technology. The \"Cookie policy\" page details what is used, including the administration session cookie, which is strictly necessary for the private dashboard to work.",
          ],
        },
      ],
    },

    cookies: {
      title: "Cookie policy",
      intro:
        "This website is built to work without targeted advertising or third-party audience measurement. This page describes exactly what is stored in your browser.",
      sections: [
        {
          heading: "Strictly necessary cookies",
          paragraphs: [
            "One cookie is set: a session cookie reserved for the website's administration area, which keeps the administrator signed in. It is purely functional, expires after a limited period, and is never used for tracking or advertising.",
            "It is only created if you sign in to the administration panel yourself.",
          ],
        },
        {
          heading: "No advertising trackers",
          paragraphs: [
            "This website uses no advertising cookie, no social-network pixel and no third-party audience tracker. No behavioural analytics tool is integrated.",
          ],
        },
        {
          heading: "Local storage",
          paragraphs: [
            "A temporary value may be stored in your browser's session storage when you begin filling in the quote form from the home page. It only carries your first entries into the full form, is cleared as soon as you submit or close the tab, and is never sent to a server.",
          ],
        },
        {
          heading: "If this changes",
          paragraphs: [
            "Any future change to the website that adds a cookie or tracker which is not strictly necessary will result in an update to this page and, where required, a consent banner.",
          ],
        },
      ],
    },
  },
};