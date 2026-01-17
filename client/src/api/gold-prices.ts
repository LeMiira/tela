import * as cheerio from "cheerio";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ENPARA_URL =
  "https://www.enpara.com/hesaplar/doviz-ve-altin-kurlari";

function parseTurkishNumber(value: string): number {
  return Number(
    value
      .replace("TL", "")
      .trim()
      .replace(/\./g, "")
      .replace(",", ".")
  );
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const response = await fetch(ENPARA_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Enpara page");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const goldRow = $(".enpara-gold-exchange-rates__table-item.XAU");

    if (!goldRow.length) {
      throw new Error("Gold row not found in HTML");
    }

    const spans = goldRow.find("span");

    const buyText = $(spans[1]).text();
    const sellText = $(spans[2]).text();

    const buy = parseTurkishNumber(buyText);
    const sell = parseTurkishNumber(sellText);

    res.status(200).json({
      source: "enpara.com",
      product: "Altın (gram)",
      currency: "TRY",
      buy,
      sell,
      raw: { buyText, sellText },
      fetched_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Enpara scrape error:", error);
    res.status(500).json({
      error: "Failed to fetch gold prices from Enpara"
    });
  }
}
