# shopify-email-scraper

Not perfect, but it does scrape about 85-90% of the available emails on shopify pages.

## Features

- utilizes asynchronous threads and promises (especially `Promise.all()`) -> it can be furhter optimized
- ignores inactive or unsafe pages
- does not do well with foreign pages (if the urls are not in english) -> feel free to create a PR which optimizes by scraping each link instead of static sublinks
- opens unscraped links after processing the urls
- creates a new excel file and populates the columns with emails

## Usage

1. start the server
2. make a post request to `/`, include urls array in the body
3. wait for the magic (time increases with the amount of urls)
