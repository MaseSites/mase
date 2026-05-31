// Neutrales Zahlungs-Interface.
//
// Aktuell: "manuelle" Abwicklung ohne echte Zahlung (nur Katalog + Warenkorb).
// Später: Hier einen Stripe-Adapter einsetzen, ohne die Routen/Checkout-Logik zu ändern.
//
// Beispiel für später (Stripe):
//   import Stripe from 'stripe';
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//   async function createCheckout(order) {
//     const session = await stripe.checkout.sessions.create({ ... });
//     return { redirectUrl: session.url, provider: 'stripe' };
//   }

export const paymentProvider = {
  name: 'manual',

  /**
   * Startet den Bezahlvorgang für eine Bestellung.
   * @returns {{ redirectUrl: string|null, provider: string }}
   */
  async createCheckout(order) {
    // Keine externe Zahlung – Bestellung gilt als "offen" und wird manuell bearbeitet.
    return { redirectUrl: null, provider: 'manual' };
  },

  /**
   * Bestätigt eine Zahlung (z.B. via Webhook). Aktuell No-Op.
   */
  async confirmPayment(/* reference, payload */) {
    return { confirmed: false };
  },
};
