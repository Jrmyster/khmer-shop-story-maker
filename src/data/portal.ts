import { configuredUrl } from "../providers";
export const portalMetadata = {
  id: "khmer-shop-story-maker",
  title: {
    en: "Khmer Shop Story Maker",
    km: "អ្នកបង្កើតវីដេអូផ្សព្វផ្សាយហាងខ្មែរ",
  },
  description: {
    en: "Create attractive promotional stories and short videos for your shop using product photos, Khmer or English descriptions, prices, contact details, and your own KHQR.",
    km: "បង្កើតរឿងផ្សព្វផ្សាយ និងវីដេអូខ្លីៗសម្រាប់ហាងរបស់អ្នក ដោយប្រើរូបថតផលិតផល អត្ថបទជាភាសាខ្មែរ ឬអង់គ្លេស តម្លៃ ព័ត៌មានទំនាក់ទំនង និង KHQR របស់អ្នក។",
  },
  category: "utilities",
  icon: "Clapperboard",
  url: configuredUrl(import.meta.env.VITE_APP_URL),
  status: configuredUrl(import.meta.env.VITE_APP_URL)
    ? "ready"
    : "awaiting-deployment",
  keywords: [
    "shop",
    "merchant",
    "business",
    "video",
    "story",
    "KHQR",
    "Facebook",
    "TikTok",
    "Telegram",
    "Instagram",
    "ហាង",
    "ផ្សព្វផ្សាយ",
    "វីដេអូ",
    "អាជីវកម្ម",
  ],
  offlineReady: true,
} as const;
