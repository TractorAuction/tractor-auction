# Partner CSV feed

How an auction house without an API gets listings onto TractorAuction.com: one
Google Sheet (or any CSV at a public URL), synced every hour by the
**Partner Feed (CSV)** source.

## Columns

One row per lot. Header names must match exactly; extra columns are ignored.

| Column | Required | Notes |
|---|---|---|
| `lot_id` | yes | Your own unique id for the lot. Never reuse one. |
| `listing_url` | yes | The lot's page on your site, where buyers bid. |
| `title` | recommended | e.g. `2018 John Deere 6155M`. Built from year/make/model if blank. |
| `category` | | `tractor`, `combine`, `attachment`, … Guessed from the title if blank. |
| `make`, `model`, `year`, `horsepower`, `hours` | | Numbers only in `year`, `horsepower`, `hours`. |
| `condition`, `drive_type`, `serial_number`, `lot_number` | | Free text. |
| `city`, `state`, `zip` | | Two-letter state. ZIP powers radius search. |
| `auction_company` | | Your company name as buyers should see it. |
| `auction_end_date` | recommended | ISO time, e.g. `2026-11-02T18:00:00Z`. Past dates are hidden. |
| `auction_type` | | `online`, `live`, `timed`, … |
| `current_bid`, `buy_it_now_price` | | Dollars, e.g. `96500`. |
| `description` | | Plain text. |
| `image_urls` | recommended | Photo links, separated by spaces or new lines; the first is the cover. Direct image links work best; Google Drive and Dropbox share links are converted automatically, but a Drive photo must be shared "Anyone with the link". Extra `image_1`, `image_2`, … columns also work. |

## Switching it on

1. In the sheet: **File → Share → Publish to web**, choose the tab and
   **Comma-separated values (.csv)**, publish, and copy the link.
2. In admin → **Sources**, edit **Partner Feed (CSV)**: paste the link into
   *Feed / API endpoint*, set status **active**, tick **Auto-sync feed**, save.
3. Click **Sync now** on that row. The sync status and any row errors show on
   the same row; listings appear on the site straight after a successful run.

Rows are removed from the site when their auction end date passes. Editing a
row updates the listing on the next sync (hourly, or **Sync now**).
