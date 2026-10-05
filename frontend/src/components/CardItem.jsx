import { CreditCard, Wifi, Trash2 } from "lucide-react";

const cardThemes = {
  VISA: {
    background: "linear-gradient(135deg, #0b3fa8 0%, #1769e8 55%, #0b4cc4 100%)",
    logo: "VISA",
    logoStyle: "italic font-black tracking-tight",
  },
  MASTERCARD: {
    background: "linear-gradient(135deg, #171717 0%, #3b3b3b 55%, #111111 100%)",
    logo: "MASTERCARD",
    logoStyle: "font-black tracking-tight",
  },
  AMEX: {
    background: "linear-gradient(135deg, #0876a8 0%, #1595c8 55%, #05648e 100%)",
    logo: "AMERICAN EXPRESS",
    logoStyle: "font-black tracking-wide text-xs",
  },
  RUPAY: {
    background: "linear-gradient(135deg, #4b176f 0%, #7b269f 55%, #42115f 100%)",
    logo: "RuPay",
    logoStyle: "font-black italic",
  },
};

function getTheme(cardType) {
  const type = String(cardType || "VISA").toUpperCase();

  if (type.includes("MASTER")) return cardThemes.MASTERCARD;
  if (type.includes("AMEX") || type.includes("AMERICAN")) return cardThemes.AMEX;
  if (type.includes("RUPAY") || type.includes("RUPAY")) return cardThemes.RUPAY;

  return cardThemes.VISA;
}

export default function CardItem({ card, onDelete }) {
  const theme = getTheme(card.card_type);

  const cardNumber =
    card.masked_card_number ||
    `•••• •••• •••• ${card.last_four_digits || "0000"}`;

  const expiry = `${String(card.expiry_month).padStart(2, "0")}/${card.expiry_year}`;

  return (
    <div className="group w-full max-w-[430px]">
      <div
        className="relative aspect-[1.586/1] overflow-hidden rounded-[22px] p-7 text-white shadow-lg transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:shadow-2xl active:scale-[0.97] active:translate-y-0"
        style={{ background: theme.background }}
      >
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-white/10" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/70">
                {card.card_category || "CREDIT"}
              </p>

              <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-white/90">
                {card.card_type || "VISA"}
              </p>
            </div>

            <div className="text-right">
              <p className={theme.logoStyle}>{theme.logo}</p>
              <p className="mt-1 text-[9px] tracking-widest text-white/70">
                PAYMENT CARD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-11 w-[58px] overflow-hidden rounded-lg border border-white/30 bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-500 shadow-md">
              <div className="absolute left-1/2 top-0 h-full w-px bg-yellow-700/30" />
              <div className="absolute left-0 top-1/2 h-px w-full bg-yellow-700/30" />
              <div className="absolute left-1/3 top-0 h-full w-px bg-yellow-700/20" />
              <div className="absolute left-0 top-1/3 h-px w-full bg-yellow-700/20" />
            </div>

            <Wifi className="h-7 w-7 rotate-90 text-white/80" />
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-white/60">
              Card Number
            </p>

            <p className="mt-1 whitespace-nowrap text-xl font-semibold tracking-[0.18em]">
              {cardNumber}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">
                Cardholder
              </p>

              <p className="mt-1 text-sm font-semibold uppercase tracking-wider">
                {card.cardholder_name}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">
                Valid Thru
              </p>

              <p className="mt-1 text-sm font-semibold tracking-wider">
                {expiry}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-6 opacity-20">
          <CreditCard className="h-8 w-8" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(card.id)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-md active:scale-[0.97] cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
        Delete Card
      </button>
    </div>
  );
}