#!/usr/bin/env python3
"""
Sudan Crops Exchange - Automated Crop Prices Scraper & Sync
Fetches daily market prices from https://souq.mib-sd.com/ (Gadarif Crops Market)
and upserts normalized records into Supabase `crop_prices` table.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from typing import Any

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

SOURCE_URL = "https://souq.mib-sd.com/"
SOURCE_NAME = "souq.mib-sd.com"
DEFAULT_CITY = "القضارف"
DEFAULT_CURRENCY = "SDG"

# Eastern Arabic & Persian digits -> Western ASCII digits
_DIGIT_TRANSLATION = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹٫٬", "01234567890123456789.,")
_EMPTY_MARKERS = {"", "-", "—", "–", "−", "n/a", "na", "null", "none", "غير متوفر"}


def configure_utf8_stdio() -> None:
    """Ensure UTF-8 output on Windows consoles."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8")
            except Exception:
                pass


def normalize_digits(text: str) -> str:
    """Convert Arabic/Persian digits and punctuation to standard ASCII."""
    return text.translate(_DIGIT_TRANSLATION).strip()


def parse_number(raw: str | None) -> float | None:
    """Parse Arabic/English formatted numeric string into float, or None if unavailable."""
    if not raw:
        return None
    cleaned = normalize_digits(raw)
    if cleaned.lower() in _EMPTY_MARKERS:
        return None
    cleaned = cleaned.replace("ج.س", "")
    cleaned = re.sub(r"[,\s%٪+]", "", cleaned)
    if not cleaned or cleaned in {"-", "—", "–"}:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def parse_int(raw: str | None, default: int = 0) -> int:
    """Parse integer count (e.g., arrivals in sacks)."""
    val = parse_number(raw)
    if val is None:
        return default
    return int(round(val))


def parse_percent(raw: str | None, default: float = 0.0) -> float:
    """Parse percentage string like '+17.2%' or '-5.7%' into float."""
    val = parse_number(raw)
    if val is None:
        return default
    return round(val, 2)


def infer_category(crop_name: str, section_title: str = "") -> str:
    """Classify crop into Arabic category based on crop name and table section."""
    name_norm = crop_name.strip()
    section_norm = section_title.strip()

    if "تسالي" in name_norm:
        return "تسالي"
    if any(k in name_norm for k in ("سمسم", "زهرة", "فول سوداني", "كركدي")):
        return "محاصيل زيتية"
    if "سمسم" in section_norm or "زهرة" in section_norm:
        return "محاصيل زيتية"
    return "حبوب"


def extract_recorded_date(soup: BeautifulSoup, html_text: str) -> str:
    """Extract YYYY-MM-DD bulletin date from page JS/meta, falling back to Sudan date."""
    # 1. window.MIB = { ..., "latest":"2026-11-15", ... }
    mib_match = re.search(r'"latest"\s*:\s*"(\d{4}-\d{2}-\d{2})"', html_text)
    if mib_match:
        return mib_match.group(1)

    # 2. <meta property="og:image" content="https://souq.mib-sd.com/og/2026-11-15.png">
    og_img = soup.find("meta", property="og:image")
    if og_img and og_img.get("content"):
        og_match = re.search(r"(\d{4}-\d{2}-\d{2})", str(og_img["content"]))
        if og_match:
            return og_match.group(1)

    # 3. Fallback: current date in Sudan (UTC+2)
    sudan_tz = timezone(timedelta(hours=2))
    return datetime.now(sudan_tz).strftime("%Y-%m-%d")


def extract_crop_name(cell: Any) -> str:
    """Extract clean crop name from the first cell, ignoring badge chips like 'خارج الإجمالي'."""
    link = cell.find("a", class_="crop-link")
    if link:
        return " ".join(link.get_text(" ", strip=True).split())

    # Remove auxiliary .chip badges if no <a> tag is present
    parts: list[str] = []
    for child in cell.children:
        if getattr(child, "name", None) and "chip" in (child.get("class") or []):
            continue
        txt = child.get_text(" ", strip=True) if hasattr(child, "get_text") else str(child).strip()
        if txt:
            parts.append(txt)
    return " ".join(" ".join(parts).split())


def map_column_indices(headers: list[str]) -> dict[str, int]:
    """Map header titles to column indices dynamically with safe defaults."""
    mapping: dict[str, int] = {}
    for idx, h in enumerate(headers):
        h_clean = h.strip()
        if "الصنف" in h_clean or "المحصول" in h_clean:
            mapping["crop_name"] = idx
        elif "الوحدة" in h_clean:
            mapping["unit"] = idx
        elif "أعلى" in h_clean:
            mapping["max_price"] = idx
        elif "أدنى" in h_clean:
            mapping["min_price"] = idx
        elif "التغي" in h_clean:
            mapping["change_percent"] = idx
        elif "الوارد" in h_clean:
            mapping["arrivals_sacks"] = idx

    # Positional fallback matching souq.mib-sd.com standard 6-column table
    defaults = {
        "crop_name": 0,
        "unit": 1,
        "max_price": 2,
        "min_price": 3,
        "change_percent": 4,
        "arrivals_sacks": 5,
    }
    for key, pos in defaults.items():
        mapping.setdefault(key, pos)
    return mapping


def parse_souq_html(html_text: str) -> list[dict[str, Any]]:
    """Parse HTML from souq.mib-sd.com into structured crop_prices records."""
    soup = BeautifulSoup(html_text, "html.parser")
    recorded_date = extract_recorded_date(soup, html_text)
    records: list[dict[str, Any]] = []

    tables = soup.select("table.ptbl") or soup.find_all("table")
    for table in tables:
        # Locate enclosing card header <h3> for category context
        section_title = ""
        card = table.find_parent("div", class_="card")
        if card:
            h3 = card.find("h3")
            if h3:
                section_title = h3.get_text(" ", strip=True)

        header_row = table.find("thead")
        headers: list[str] = []
        if header_row:
            headers = [th.get_text(" ", strip=True) for th in header_row.find_all(["th", "td"])]
        else:
            first_tr = table.find("tr")
            if first_tr:
                headers = [th.get_text(" ", strip=True) for th in first_tr.find_all(["th", "td"])]

        col_map = map_column_indices(headers)

        tbody = table.find("tbody")
        rows = tbody.find_all("tr") if tbody else table.find_all("tr")[1:]

        for tr in rows:
            cells = tr.find_all("td")
            if len(cells) < 4:
                continue

            crop_name = extract_crop_name(cells[col_map["crop_name"]])
            if not crop_name:
                continue

            unit = cells[col_map["unit"]].get_text(" ", strip=True) if col_map["unit"] < len(cells) else "أردب"
            max_price = parse_number(cells[col_map["max_price"]].get_text(" ", strip=True)) if col_map["max_price"] < len(cells) else None
            min_price = parse_number(cells[col_map["min_price"]].get_text(" ", strip=True)) if col_map["min_price"] < len(cells) else None
            change_percent = parse_percent(cells[col_map["change_percent"]].get_text(" ", strip=True)) if col_map["change_percent"] < len(cells) else 0.0
            arrivals_sacks = parse_int(cells[col_map["arrivals_sacks"]].get_text(" ", strip=True)) if col_map["arrivals_sacks"] < len(cells) else 0

            if min_price is not None and max_price is not None:
                avg_price = round((min_price + max_price) / 2.0, 2)
            elif max_price is not None:
                avg_price = max_price
            elif min_price is not None:
                avg_price = min_price
            else:
                avg_price = 0.0

            records.append(
                {
                    "crop_name": crop_name,
                    "category": infer_category(crop_name, section_title),
                    "market_city": DEFAULT_CITY,
                    "unit": unit,
                    "min_price": min_price,
                    "max_price": max_price,
                    "avg_price": avg_price,
                    "change_percent": change_percent,
                    "arrivals_sacks": arrivals_sacks,
                    "currency": DEFAULT_CURRENCY,
                    "source": SOURCE_NAME,
                    "recorded_date": recorded_date,
                }
            )

    return records


def fetch_live_html(url: str = SOURCE_URL) -> str:
    """Fetch HTML from souq.mib-sd.com with browser-like headers."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "ar,en;q=0.9",
    }
    response = requests.get(url, headers=headers, timeout=25)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or "utf-8"
    return response.text


def upsert_to_supabase(records: list[dict[str, Any]]) -> int:
    """Upsert extracted crop records into Supabase `crop_prices` table."""
    if not records:
        return 0

    load_dotenv()
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        raise RuntimeError(
            "Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
        )

    from supabase import create_client

    client = create_client(supabase_url, service_key)
    result = (
        client.table("crop_prices")
        .upsert(records, on_conflict="crop_name,market_city,recorded_date")
        .execute()
    )
    return len(result.data) if getattr(result, "data", None) is not None else len(records)


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(
        description="Sync daily Sudan (Gadarif) crop prices from souq.mib-sd.com to Supabase."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and parse prices, print formatted JSON to stdout without writing to Supabase.",
    )
    parser.add_argument(
        "--html-file",
        type=str,
        default=None,
        help="Optional path to a saved HTML snapshot instead of fetching live URL.",
    )
    args = parser.parse_args()

    try:
        if args.html_file:
            with open(args.html_file, "r", encoding="utf-8") as fh:
                html_text = fh.read()
        else:
            html_text = fetch_live_html(SOURCE_URL)

        records = parse_souq_html(html_text)
        if not records:
            print("WARNING: No crop records were extracted from source HTML.", file=sys.stderr)
            return 1

        if args.dry_run:
            payload = {
                "source": SOURCE_URL,
                "count": len(records),
                "recorded_date": records[0]["recorded_date"],
                "records": records,
            }
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            return 0

        upserted_count = upsert_to_supabase(records)
        print(
            f"Successfully upserted {upserted_count} crop price records "
            f"for {records[0]['recorded_date']} ({DEFAULT_CITY})."
        )
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
