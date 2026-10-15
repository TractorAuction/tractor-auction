/**
 * Stock photos shown when a listing's source supplies none (GSA Auctions only
 * serves photos to signed-in GSA users). One per equipment category, always
 * labelled "Representative photo" so nobody mistakes it for the machine being
 * sold. All from Wikimedia Commons under free licenses; the credits below are
 * what those licenses require us to show (see /photo-credits).
 */
export type StockPhoto = {
  src: string
  title: string
  author: string
  license: string
  licenseUrl: string | null
  sourceUrl: string
}

export const STOCK_PHOTOS: Record<string, StockPhoto> = {
  "tractor": {
    src: "/stock/tractor.jpg",
    title: "John Deere 6310",
    author: "JoachimKohler-HB",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:John_Deere_6310.jpg",
  },
  "combine": {
    src: "/stock/combine.jpg",
    title: "John Deere Combine Harvester Ebing 1828",
    author: "Ermell",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:John_Deere_Combine_Harvester_Ebing_1828.jpg",
  },
  "planter": {
    src: "/stock/planter.jpg",
    title: "Indiana Soybean Planting 2021 (20210513-NRCS-BJOC-0007)",
    author: "USDAgov",
    license: "Public domain",
    licenseUrl: null,
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Indiana_Soybean_Planting_2021_(20210513-NRCS-BJOC-0007).jpg",
  },
  "sprayer": {
    src: "/stock/sprayer.jpg",
    title: "Sprayer in a field - geograph.org.uk - 2313172",
    author: "Steve Daniels",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sprayer_in_a_field_-_geograph.org.uk_-_2313172.jpg",
  },
  "tillage": {
    src: "/stock/tillage.jpg",
    title: "Steyr 6195 CVT tractor, Werktuigendagen 2009",
    author: "werktuigendagen",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Steyr_6195_CVT_tractor,_Werktuigendagen_2009.jpg",
  },
  "hay-forage": {
    src: "/stock/hay-forage.jpg",
    title: "Round straw bales in Bavaria -01",
    author: "High Contrast",
    license: "CC BY 3.0 de",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/de/deed.en",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Round_straw_bales_in_Bavaria_-01.jpg",
  },
  "skid-steer": {
    src: "/stock/skid-steer.jpg",
    title: "Bobcat T650 compact track loader (side view)",
    author: "Dmitry Ivanov",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Bobcat_T650_compact_track_loader_(side_view).jpg",
  },
  "attachment": {
    src: "/stock/attachment.jpg",
    title: "Holder L 780",
    author: "Max Holder GmbH (user Holder Marketing)",
    license: "CC BY-SA 3.0 de",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/de/deed.en",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Holder_L_780.jpg",
  },
  "construction": {
    src: "/stock/construction.jpg",
    title: "Caterpillar 330 excavator on a pile of dirt",
    author: "Matthew T Rader",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Caterpillar_330_excavator_on_a_pile_of_dirt.jpg",
  },
  "truck-trailer": {
    src: "/stock/truck-trailer.jpg",
    title: "Flatbed semi-truck trailer hauling recycling alongside Ford landscaping truck, I-90 westbound, Spokane, WA 2024",
    author: "Ewkada",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Flatbed_semi-truck_trailer_hauling_recycling_alongside_Ford_landscaping_truck,_I-90_westbound,_Spokane,_WA_2024.jpg",
  },
  "other": {
    src: "/stock/other.jpg",
    title: "Tractor John Deere 6320 with front and rear mower cutting grass",
    author: "Petar Milošević",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tractor_John_Deere_6320_with_front_and_rear_mower_cutting_grass.jpg",
  },
}

export const STOCK_PHOTO_LABEL = "Representative photo"

export function stockPhotoFor(category: string | null | undefined): StockPhoto {
  return STOCK_PHOTOS[category ?? ""] ?? STOCK_PHOTOS.other
}
