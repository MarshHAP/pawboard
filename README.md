# PawBoard - one-page Shopify store

A custom Shopify theme for [PawBoard](https://www.babymoppy.com): a single landing page that sells one product, with a product page, cart and account pages that share the same design.

## Structure

```
layout/theme.liquid          header, footer, toast, video modal
templates/index.liquid       the one-page store (hero, benefits, vet, comparison, reviews, materials, setup, FAQ)
templates/product.liquid     same hero + buy box, plus the product description
snippets/hero-buy.liquid     gallery + buy box (used by index and product)
snippets/icon.liquid         inline SVG icon set
snippets/photo.liquid        image with bundled fallback
assets/theme.css             all styles
assets/theme.js              gallery, AJAX add-to-cart, video modal, header, FAQ
config/settings_schema.json  theme settings: hero product, rating, video URL, photo overrides, social links
```

## Product images

The hero gallery renders the product's own media. Until the product has images, it falls back to the bundled photos in `assets/`. Section photos (vet, comparison, reviews, materials, steps) can be overridden from **Theme settings → Photos**.

## Deploying

Files are pushed to the unpublished theme "PawBoard - one page store" via the Admin GraphQL API (`themeFilesUpsert`). Publish it from **Online Store → Themes** when ready.
