export const CATEGORY_PRODUCTS_QUERY = /* GraphQL */ `
  query CategoryProducts(
    $filter: ProductAttributeFilterInput!
    $pageSize: Int!
    $currentPage: Int!
  ) {
    products(
      filter: $filter
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
      items {
        uid
        id
        sku
        name
        url_key
        stock_status
        small_image {
          url
          label
        }
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
            final_price {
              value
              currency
            }
          }
        }
      }
    }
  }
`;

export const CATEGORIES_QUERY = /* GraphQL */ `
  query Categories(
    $filters: CategoryFilterInput
    $pageSize: Int!
    $currentPage: Int!
  ) {
    categories(
      filters: $filters
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
      items {
        uid
        id
        name
        url_key
        url_path
        level
        children_count
      }
    }
  }
`;

export const CUSTOMER_QUERY = /* GraphQL */ `
  query Customer {
    customer {
      id
      email
      firstname
      lastname
      gender
      taxvat
      customer_code
      industry
      created_at
      default_billing
      default_shipping
      addresses {
        id
        firstname
        lastname
        company
        street
        city
        region {
          region
          region_id
        }
        postcode
        country_code
        telephone
        default_billing
        default_shipping
      }
    }
  }
`;

// Customer addresses via native `customer { addresses }` — backs the GraphQL /addresses routes.
// Full address field set (incl. company / region_code / vat_id) so the address-book UI shape
// is preserved. (CUSTOMER_QUERY's address selection omits company/region_code, hence a focused
// query here.)
export const CUSTOMER_ADDRESSES_QUERY = /* GraphQL */ `
  query CustomerAddresses {
    customer {
      addresses {
        id
        firstname
        lastname
        company
        street
        city
        region {
          region
          region_id
          region_code
        }
        postcode
        country_code
        telephone
        vat_id
        default_billing
        default_shipping
      }
    }
  }
`;

// Customer wishlist (native Magento) — backs the GraphQL /favorite-products list. items_v2 is
// paginated; product carries the fields the favourites UI maps (sku/name/image/price/stock).
export const CUSTOMER_WISHLIST_QUERY = /* GraphQL */ `
  query CustomerWishlist($currentPage: Int!, $pageSize: Int!) {
    customer {
      wishlists {
        id
        items_count
        items_v2(currentPage: $currentPage, pageSize: $pageSize) {
          items {
            id
            quantity
            product {
              id
              sku
              name
              url_key
              stock_status
              pattern
              origin
              image { url }
              price_range {
                minimum_price {
                  final_price { value currency }
                  regular_price { value }
                }
              }
            }
          }
          page_info { current_page page_size total_pages }
        }
      }
    }
  }
`;

// Resolves product select-attribute option IDs → labels (e.g. pattern/origin). The native
// ProductInterface returns these attributes as option IDs; this maps them to display labels.
export const PRODUCT_ATTRIBUTE_OPTIONS_QUERY = /* GraphQL */ `
  query ProductAttributeOptions {
    customAttributeMetadata(
      attributes: [
        { attribute_code: "pattern", entity_type: "catalog_product" }
        { attribute_code: "origin", entity_type: "catalog_product" }
      ]
    ) {
      items {
        attribute_code
        attribute_options { value label }
      }
    }
  }
`;

export const KLEVER_ACCOUNT_SIDEBAR_QUERY = /* GraphQL */ `
  query KleverAccountSidebar {
    kleverAccountSidebar {
      user_type
      items {
        code
        label
        url
        is_visible
        sort_order
      }
    }
  }
`;



export const KLEVER_CUSTOMER_TARGET_DASHBOARD_QUERY = /* GraphQL */ `
  query KleverCustomerTargetDashboard($searchYear: Int, $compareYear: Int) {
    kleverCustomerTargetDashboard(searchYear: $searchYear, compareYear: $compareYear) {
      customer_name
      current_year
      available_years
      yearly_summary { year period qty amount }
      quarterly_summary { year period qty amount }
      monthly_summary { year period qty amount }
      product_groups { product_group qty }
      tyre_sizes { size_pattern qty }
      compare_quarterly { year period qty amount }
      compare_monthly { year period qty amount }
    }
  }
`;

export const KLEVER_BUSINESS_OVERVIEW_QUERY = /* GraphQL */ `
  query KleverBusinessOverview {
    kleverBusinessOverview {
      total_employees
      trucks
      annual_revenue
      business_model
      products_offered
      success
      message
    }
  }
`;

export const KLEVER_TARGETS_ACHIEVEMENTS_QUERY = /* GraphQL */ `
  query KleverTargetsAchievements($year: Int) {
    kleverTargetsAchievements(year: $year) {
      available_years
      years {
        achievement
        incentive
        sales_target
        year
      }
    }
  }
`;

export const KLEVER_CREDIT_ACCOUNT_QUERY = /* GraphQL */ `
  query KleverCreditAccount {
    kleverCreditAccount {
      total_credit_limit
      used_credit_limit
      available_credit_limit
      currency
      has_permission
      is_visible
      success
      message
    }
  }
`;

export const KLEVER_MY_STATEMENT_QUERY = /* GraphQL */ `
  query KleverMyStatement($fromDate: String, $toDate: String, $statementType: String) {
    kleverMyStatement(fromDate: $fromDate, toDate: $toDate, statementType: $statementType) {
      pdf_url
    }
  }
`;

export const KLEVER_STATEMENT_TYPES_QUERY = /* GraphQL */ `
  query KleverStatementTypes {
    kleverStatementTypes {
      code
      label
    }
  }
`;

// NOTE: two fields removed from this query because they break against the live schema:
//   - `permissions`: schema types it [Int] but the resolver returns string permission
//     codes (e.g. "account_data_modification_permission") → "Expected a value of type Int".
//   - `parent_token`: not a field on KleverSubaccountsResponse ("Cannot query field").
// Neither is read by the frontend, so omitting them is shape-safe. (Backend schema
// bugs — flagged to the Magento team.)
export const KLEVER_SUBACCOUNTS_QUERY = /* GraphQL */ `
  query KleverSubaccounts {
    kleverSubaccounts {
      items {
        id
        customer_id
        firstname
        lastname
        email
        is_active
        status
        taxvat
        created_at
        updated_at
      }
      total_count
    }
  }
`;

export const KLEVER_SUBACCOUNT_PERMISSIONS_QUERY = /* GraphQL */ `
  query KleverSubaccountPermissions {
    kleverSubaccountPermissions {
      code
      label
      value
    }
  }
`;

// Single subaccount by id. NOTE: the real schema op is `kleverSubaccount` — there is
// NO `kleverSubaccountById` ("Cannot query field …"). `permissions` validates here, but
// like the list query it may throw at execution (schema types it [Int] yet the resolver
// returns string codes → "Expected a value of type Int"); the route returns partial data
// safely if that happens. [[klever-subaccount-permissions-type-bug]]
export const KLEVER_SUBACCOUNT_BY_ID_QUERY = /* GraphQL */ `
  query KleverSubaccount($subaccountId: Int!) {
    kleverSubaccount(subaccountId: $subaccountId) {
      id
      customer_id
      firstname
      lastname
      email
      is_active
      permissions
      status
      taxvat
      created_at
      updated_at
    }
  }
`;

export const CMS_PAGE_QUERY = /* GraphQL */ `
  query CmsPage($identifier: String!) {
    cmsPage(identifier: $identifier) {
      title
      content
      content_heading
      meta_title
      meta_keywords
      meta_description
      page_layout
      url_key
    }
  }
`;

export const KLEVER_CATEGORY_PRODUCTS_QUERY = /* GraphQL */ `
  query KleverCategoryProducts(
    $categoryId: Int
    $pageSize: Int
    $currentPage: Int
    $minPrice: Float
    $maxPrice: Float
    $searchQuery: String
    $sortBy: String
    $sortOrder: String
    $partsCategory: String
    $itemCode: String
    $brand: String
    $productGroup: String
    $tyreSize: String
    $color: String
    $width: String
    $height: String
    $rim: String
    $pattern: String
    $warrantyPeriod: String
    $offers: String
    $year: String
    $origin: String
    $manufacturer: String
    $types: String
    $runflat: String
    $oemMarking: String
    $newArrivals: String
  ) {
    kleverCategoryProducts(
      categoryId: $categoryId
      pageSize: $pageSize
      currentPage: $currentPage
      minPrice: $minPrice
      maxPrice: $maxPrice
      searchQuery: $searchQuery
      sortBy: $sortBy
      sortOrder: $sortOrder
      partsCategory: $partsCategory
      itemCode: $itemCode
      brand: $brand
      productGroup: $productGroup
      tyreSize: $tyreSize
      color: $color
      width: $width
      height: $height
      rim: $rim
      pattern: $pattern
      warrantyPeriod: $warrantyPeriod
      offers: $offers
      year: $year
      origin: $origin
      manufacturer: $manufacturer
      types: $types
      runflat: $runflat
      oemMarking: $oemMarking
      newArrivals: $newArrivals
    ) {
      total_count
      page_size
      current_page
      total_pages
      products {
        product_id
        sku
        name
        final_price
        image_url
        brand
        tyre_size
        is_in_stock
        stock_label
      }
      filters {
        code
        label
        record_count
        options {
          value
          label
          count
        }
      }
    }
  }
`;

export const KLEVER_CATEGORY_FILTER_OPTIONS_QUERY = /* GraphQL */ `
  query KleverCategoryFilterOptions($categoryId: Int!) {
    kleverCategoryFilterOptions(categoryId: $categoryId) {
      filters {
        code
        label
        record_count
        options {
          value
          label
          count
        }
      }
    }
  }
`;

// Sidebar layered-nav filters for a category. Uses kleverCategoryProducts(pageSize: 1) —
// NOT kleverCategoryFilterOptions — because the dedicated op returns only 11 groups and
// omits the category-wide "Promotions and Offers" (offers) group the sidebar needs.
// pageSize:1 keeps the product payload negligible while returning the full filter set.
// Backs /api/category-filter-options.
export const KLEVER_CATEGORY_FILTER_OPTIONS_FROM_PRODUCTS_QUERY = /* GraphQL */ `
  query CategoryFilterOptions($categoryId: Int!) {
    kleverCategoryProducts(categoryId: $categoryId, pageSize: 1) {
      filters {
        code
        label
        record_count
        options {
          value
          label
          count
        }
      }
    }
  }
`;

export const KLEVER_TYRE_SIZE_WIDTH_QUERY = /* GraphQL */ `
  query KleverTyreSizeWidth {
    kleverTyreSizeWidth {
      status
      options {
        value
        label
      }
    }
  }
`;

export const KLEVER_TYRE_SIZE_HEIGHT_QUERY = /* GraphQL */ `
  query KleverTyreSizeHeight($width: String) {
    kleverTyreSizeHeight(width: $width) {
      status
      options {
        value
        label
      }
    }
  }
`;

export const KLEVER_TYRE_SIZE_RIM_QUERY = /* GraphQL */ `
  query KleverTyreSizeRim($width: String, $height: String) {
    kleverTyreSizeRim(width: $width, height: $height) {
      status
      options {
        value
        label
      }
    }
  }
`;

export const KLEVER_SEARCH_POOL_QUERY = /* GraphQL */ `
  query KleverSearchPool($categoryId: Int!, $pageSize: Int!, $currentPage: Int!) {
    kleverCategoryProducts(
      categoryId: $categoryId
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      total_count
      products {
        sku
        name
        brand
        image_url
        product_url
        item_code
        final_price
        stock_qty
        stock_label
        stock_color
        action
        is_action
        is_in_stock
      }
    }
  }
`;

export const MGS_BRAND_OPTIONS_QUERY = /* GraphQL */ `
  query MgsBrandOptions {
    customAttributeMetadata(
      attributes: [{ attribute_code: "mgs_brand", entity_type: "catalog_product" }]
    ) {
      items {
        attribute_code
        attribute_options {
          value
          label
        }
      }
    }
  }
`;

// Lightweight typeahead — only the fields the search popup consumes (name +
// sku, plus url_key/image for future use). Deliberately omits `price_range`
// because stock `products(search:)` returns the base catalog price for B2B
// customer groups, not the customer's actual price. Prices belong on the
// product listing/detail pages which fetch via `kleverCategoryProducts`.
export const PRODUCTS_SEARCH_QUERY = /* GraphQL */ `
  query ProductsSearch($search: String!, $pageSize: Int!, $currentPage: Int!) {
    products(search: $search, pageSize: $pageSize, currentPage: $currentPage) {
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
      items {
        id
        sku
        name
        url_key
        small_image {
          url
        }
      }
    }
  }
`;

export const CUSTOMER_CART_QUERY = /* GraphQL */ `
  query CustomerCart {
    customerCart {
      id
      total_quantity
      items {
        id
        product {
          sku
          name
          small_image {
            url
            label
          }
        }
        quantity
        prices {
          row_total {
            value
            currency
          }
        }
      }
      prices {
        grand_total {
          value
          currency
        }
        subtotal_excluding_tax {
          value
          currency
        }
      }
    }
  }
`;

export const CUSTOMER_CART_ID_QUERY = /* GraphQL */ `
  query CustomerCartId {
    customerCart {
      id
      items {
        id
      }
    }
  }
`;

export const CART_SHIPPING_METHODS_QUERY = /* GraphQL */ `
  query CartShippingMethods($cartId: String!) {
    cart(cart_id: $cartId) {
      shipping_addresses {
        available_shipping_methods {
          carrier_code
          method_code
          carrier_title
          method_title
          amount { value currency }
          available
        }
      }
    }
  }
`;

// export const CART_PAYMENT_METHODS_QUERY = /* GraphQL */ `
//   query CartPaymentMethods($cartId: String!) {
//     cart(cart_id: $cartId) {
//       available_payment_methods {
//         code
//         title
//       }
//       selected_payment_method {
//         code
//         title
//       }
//     }
//   }
// `;


export const CART_PAYMENT_METHODS_QUERY = /* GraphQL */ `
  query AvailablePaymentMethods($cartId: String!) {
 cart(cart_id: $cartId) {
 available_payment_methods { code title }
 }
}
`;

// Native cart.prices for the checkout totals route (kleverCheckoutTotals does not
// exist on the live schema). Money objects are flattened to numbers in the route.
export const CART_TOTALS_QUERY = /* GraphQL */ `
  query CartTotals($cartId: String!) {
    cart(cart_id: $cartId) {
      prices {
        grand_total { value currency }
        subtotal_excluding_tax { value }
        subtotal_including_tax { value }
        applied_taxes { amount { value } }
      }
      shipping_addresses {
        selected_shipping_method { amount { value } }
      }
    }
  }
`;

export const PICKUP_LOCATIONS_QUERY = /* GraphQL */ `
  query PickupLocations(
    $countryCode: String
    $pageSize: Int
    $currentPage: Int
  ) {
    pickupLocations(
      filters: { country_id: { eq: $countryCode } }
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      items {
        pickup_location_code
        name
        street
        city
        country_id
        postcode
        latitude
        longitude
      }
      total_count
      page_info {
        current_page
        page_size
        total_pages
      }
    }
  }
`;

export const CUSTOMER_ORDERS_QUERY = /* GraphQL */ `
  query CustomerOrders($pageSize: Int!, $currentPage: Int!) {
    customer {
      orders(pageSize: $pageSize, currentPage: $currentPage) {
        total_count
        items {
          id
          number
          order_date
          status
          total {
            grand_total { value currency }
          }
          items {
            product_name
            product_sku
            quantity_ordered
          }
        }
        page_info {
          current_page
          page_size
          total_pages
        }
      }
    }
  }
`;


export const KLEVER_ORDER_FILTER_OPTIONS_QUERY = /* GraphQL */ `
  query KleverOrderFilterOptions {
    kleverOrderFilterOptions {
      status_options { label value }
      company_options { label value }
    }
  }
`;

export const KLEVER_ORDER_ATTACHMENTS_QUERY = /* GraphQL */ `
  query KleverOrderAttachments($orderId: Int!) {
    kleverOrderAttachments(orderId: $orderId) {
      attachments {
        attachment_id
        file_name
        file_url
        upload_date
        document_type
        payment_status
        invoice_due
      }
    }
  }
`;

export const KLEVER_PRINT_ORDER_QUERY = /* GraphQL */ `
  query KleverPrintOrder($orderId: Int!) {
    kleverPrintOrder(orderId: $orderId) {
      order_number
      order_date
      order_status
      billing_address {
        name
        company
        street
        city
        region
        postcode
        country_id
        telephone
      }
      shipping_address {
        name
        company
        street
        city
        region
        postcode
        country_id
        telephone
      }
      items {
        name
        sku
        price
        qty_ordered
        qty_canceled
        qty_refunded
        qty_shipped
        subtotal
      }
      totals {
        currency_code
        subtotal
        discount
        shipping
        tax
        tax_label
        grand_total
      }
      shipping_method
      payment_method
    }
  }
`;

export const KLEVER_ORDER_PDF_QUERY = /* GraphQL */ `
  query KleverOrderPdf($orderId: Int!) {
    kleverOrderPdf(orderId: $orderId) {
      success
      filename
      base64
      mime_type
    }
  }
`;

export const KLEVER_EXPORT_ORDERS_QUERY = /* GraphQL */ `
  query KleverExportOrders {
    kleverExportOrders {
      success
      filename
      base64
      mime_type
      total_orders
      total_rows
      
    }
  }
`;

export const KLEVER_ORDER_UPLOAD_SEARCH_QUERY = /* GraphQL */ `
  query KleverOrderUploadSearch($pageSize: Int, $currentPage: Int) {
    kleverOrderUploadSearch(pageSize: $pageSize, currentPage: $currentPage) {
      items {
        id
        order_id
        file_name
        file_path
        comment
        upload_for
        created_at
        payment_status
      }
      total_count
      page_size
      current_page
      total_pages
    }
  }
`;

export const KLEVER_ORDER_UPLOAD_FILTER_OPTIONS_QUERY = /* GraphQL */ `
  query KleverOrderUploadFilterOptions {
    kleverOrderUploadFilterOptions {
      document_types { label value }
      invoice_due_options { label value }
      company_options { label value }
    }
  }
`;


// Forecast file content for download (GraphQL: kleverForecastFile(forecastId: Int!)). Returns
// base64 the route decodes + streams. Replaces the REST/blob forecast download.
export const KLEVER_FORECAST_FILE_QUERY = /* GraphQL */ `
  query KleverForecastFile($forecastId: Int!) {
    kleverForecastFile(forecastId: $forecastId) {
      success
      filename
      mime_type
      base64
    }
  }
`;

export const KLEVER_FORECAST_LIST_QUERY = /* GraphQL */ `
  query KleverForecastList($pageSize: Int, $currentPage: Int) {
    kleverForecastList(pageSize: $pageSize, currentPage: $currentPage) {
      items {
        forecast_id
        file_name
        file_url
        uploaded_date
      }
      total_count
      page_size
      current_page
      total_pages
      message
    }
  }
`;

export const KLEVER_QUICK_ORDER_SEARCH_QUERY = /* GraphQL */ `
  query KleverQuickOrderSearch($query: String!, $pageSize: Int) {
    kleverQuickOrderSearch(query: $query, pageSize: $pageSize) {
      items {
        product_id
        sku
        name
        price
        image_url
        is_in_stock
      }
      total_count
    }
  }
`;

export const KLEVER_QUICK_ORDER_DOWNLOAD_CSV_QUERY = /* GraphQL */ `
  query KleverQuickOrderDownloadCsv($categoryId: Int) {
    kleverQuickOrderDownloadCsv(categoryId: $categoryId) {
      file_name
      file_content
      content_type
      total_products
    }
  }
`;

// Full field set: the notifications UI renders date_added_formatted (and uses the
// _ar variants for Arabic), so these must be selected or the date display breaks.
export const KLEVER_NOTIFICATIONS_QUERY = /* GraphQL */ `
  query KleverNotifications($pageSize: Int, $currentPage: Int) {
    kleverNotifications(pageSize: $pageSize, currentPage: $currentPage) {
      items {
        id
        severity
        date_added
        date_added_formatted
        title
        title_ar
        description
        description_ar
        url
        product_item_code
        is_read
      }
      total_count
      unread_count
    }
  }
`;


export const KLEVER_CHECKOUT_TOTALS_QUERY = /* GraphQL */ `
  query KleverCheckoutTotals {
    kleverCheckoutTotals {
      cart_id
      subtotal
      shipping_amount
      tax_amount
      discount_amount
      grand_total
      currency_code
      shipping_method
      billing_address {
        id
        firstname
        lastname
        company
        street
        city
        region
        region_id
        postcode
        country_id
        telephone
        email
      }
      shipping_address {
        id
        firstname
        lastname
        company
        street
        city
        region
        region_id
        postcode
        country_id
        telephone
        email
      }
      items {
        item_id
        product_id
        sku
        name
        qty
        price
        row_total
        image_url
        product_url
        size_display
        pattern_display
      }
    }
  }
`;

export const KLEVER_CHECKOUT_PO_NUMBER_QUERY = /* GraphQL */ `
  query KleverCheckoutPoNumber {
    kleverCheckoutPoNumber
  }
`;

// Returns the order comment string (or null).
export const KLEVER_CHECKOUT_ORDER_COMMENT_QUERY = /* GraphQL */ `
  query KleverGetOrderComment {
    kleverGetOrderComment
  }
`;

// Returns an array of uploaded PO file objects (scalar JSON list).
export const KLEVER_CHECKOUT_PO_FILES_QUERY = /* GraphQL */ `
  query KleverGetPoFiles {
    kleverGetPoFiles
  }
`;

export const KLEVER_CHECKOUT_SHIPPING_EXTRAS_QUERY = /* GraphQL */ `
  query KleverCheckoutShippingExtras {
    kleverCheckoutShippingExtras {
      delivery_date
      delivery_comment
      pickup_store
      pickup_date
      pickup_time
      pickup_person_name
      pickup_mobile_number
      fee
    }
  }
`;

// Catalog op is kleverPickupTimeSlots → { time, available } (not time/label/enabled).
export const KLEVER_CHECKOUT_PICKUP_TIME_SLOTS_QUERY = /* GraphQL */ `
  query KleverPickupTimeSlots($storeId: Int!, $date: String!) {
    kleverPickupTimeSlots(storeId: $storeId, date: $date) {
      time
      available
    }
  }
`;

// Catalog op kleverPickupStores → store_id/name/address/city/country/phone/lat/long.
export const KLEVER_PICKUP_STORES_QUERY = /* GraphQL */ `
  query KleverPickupStores {
    kleverPickupStores {
      store_id
      name
      address
      city
      country
      phone
      latitude
      longitude
    }
  }
`;

export const KLEVER_CHECKOUT_SUCCESS_QUERY = /* GraphQL */ `
  query KleverCheckoutSuccess($orderId: Int!) {
    kleverCheckoutSuccess(orderId: $orderId) {
      order_id
      order_increment_id
      message
      continue_shopping_url
      order_view_url
    }
  }
`;



// Klever custom storefront menu (now exposed on the schema). Fields: code, label, url,
// is_visible, sort_order. NOTE: `category_id` is NOT a field on KleverMenuItem
// ("Cannot query field …") — removed. Backs /api/kleverapi/menu.
export const KLEVER_MENU_ITEMS_QUERY = /* GraphQL */ `
  query KleverMenuItems {
    kleverMenuItems {
      code
      label
      url
      is_visible
      sort_order
    }
  }
`;

// ─── Multi-shipping (read queries) ───
// Multi-shipping shipping methods — per quote address, the available carrier/method
// rates. Returns { addresses[{ quote_address_id, customer_address_id, street, city,
// region, postcode, country_id, methods[{ carrier_code, method_code, carrier_title,
// method_title, amount, base_amount, available, error_message, price_excl_tax,
// price_incl_tax }] }] }.
export const KLEVER_MULTISHIPPING_SHIPPING_METHODS_QUERY = /* GraphQL */ `
  query KleverMultishippingShippingMethods {
    kleverMultishippingShippingMethods {
      addresses {
        quote_address_id
        customer_address_id
        street
        city
        region
        postcode
        country_id
        methods {
          carrier_code
          method_code
          carrier_title
          method_title
          amount
          base_amount
          available
          error_message
          price_excl_tax
          price_incl_tax
        }
      }
    }
  }
`;

// Multi-shipping order-success summary. orderIds is a comma-separated string of order
// entity ids (e.g. "28675,28676"). Returns { message, continue_shopping_url,
// orders[{ order_id, order_increment_id, shipping_address, order_view_url, grand_total,
// status }] }. (multishipping read query)
export const KLEVER_MULTISHIPPING_SUCCESS_QUERY = /* GraphQL */ `
  query KleverMultishippingSuccess($orderIds: String!) {
    kleverMultishippingSuccess(orderIds: $orderIds) {
      message
      continue_shopping_url
      orders {
        order_id
        order_increment_id
        shipping_address
        order_view_url
        grand_total
        status
      }
    }
  }
`;

// ─── Category products (kleverCategoryProducts) — backs /api/category-products ───
// Shared arg declaration / arg use / product field selection so the "with filters"
// and "products only" variants can't drift apart. All filter args are optional/nullable;
// unset variables are simply ignored by the resolver. (Moved here from the route to
// follow the no-inline-GraphQL convention. Validated live against the schema.)
const _CATPROD_ARGS_DECL = `
    $categoryId: Int!, $pageSize: Int, $currentPage: Int,
    $brand: String, $color: String, $origin: String, $manufacturer: String,
    $productGroup: String, $warrantyPeriod: String, $newArrivals: String,
    $itemCode: String, $oemMarking: String, $pattern: String, $year: String,
    $types: String, $offers: String, $width: String, $height: String,
    $rim: String, $runflat: String, $partsCategory: String, $searchQuery: String,
    $minPrice: Float, $maxPrice: Float, $sortBy: String, $sortOrder: String`;
const _CATPROD_ARGS_USE = `
      categoryId: $categoryId, pageSize: $pageSize, currentPage: $currentPage,
      brand: $brand, color: $color, origin: $origin, manufacturer: $manufacturer,
      productGroup: $productGroup, warrantyPeriod: $warrantyPeriod, newArrivals: $newArrivals,
      itemCode: $itemCode, oemMarking: $oemMarking, pattern: $pattern, year: $year,
      types: $types, offers: $offers, width: $width, height: $height,
      rim: $rim, runflat: $runflat, partsCategory: $partsCategory, searchQuery: $searchQuery,
      minPrice: $minPrice, maxPrice: $maxPrice, sortBy: $sortBy, sortOrder: $sortOrder`;
const _CATPROD_PRODUCT_FIELDS = `
      total_count
      page_size
      current_page
      total_pages
      products {
        product_id sku name brand tyre_size image_url product_url
        final_price regular_price old_price special_price show_old_price
        customer_price customer_group_price offer origin pattern product_group
        warranty_period year types item_code oem_marking action is_action
        is_in_stock stock_label stock_qty stock_color price_selection_reason
      }`;

// Full variant — products + layered-nav filters.
export const KLEVER_CATEGORY_PRODUCTS_WITH_FILTERS_QUERY = /* GraphQL */ `
  query CategoryProducts(${_CATPROD_ARGS_DECL}) {
    kleverCategoryProducts(${_CATPROD_ARGS_USE}) {
      ${_CATPROD_PRODUCT_FIELDS}
      filters {
        code
        label
        record_count
        options { value label count }
      }
    }
  }
`;

// Products-only variant — omits the `filters` block. The backend computes products and
// filters as separate additive passes (~9s each), so dropping filters roughly halves
// latency. Filters are fetched separately via /api/category-filter-options.
export const KLEVER_CATEGORY_PRODUCTS_ONLY_QUERY = /* GraphQL */ `
  query CategoryProductsOnly(${_CATPROD_ARGS_DECL}) {
    kleverCategoryProducts(${_CATPROD_ARGS_USE}) {
      ${_CATPROD_PRODUCT_FIELDS}
    }
  }
`;

