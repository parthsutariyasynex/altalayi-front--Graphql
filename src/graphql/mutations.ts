export const ADD_PRODUCTS_TO_CART_MUTATION = /* GraphQL */ `
  mutation AddToCart($cartId: String!, $cartItems: [CartItemInput!]!) {
    addProductsToCart(cartId: $cartId, cartItems: $cartItems) {
      cart {
        id
        total_quantity
        items {
          id
          quantity
          product {
            sku
            name
            small_image {
              url
              label
            }
          }
        }
      }
      user_errors {
        code
        message
      }
    }
  }
`;

export const GENERATE_CUSTOMER_TOKEN_MUTATION = /* GraphQL */ `
  mutation GenerateCustomerToken($email: String!, $password: String!) {
    generateCustomerToken(email: $email, password: $password) {
      token
    }
  }
`;

export const REVOKE_CUSTOMER_TOKEN_MUTATION = /* GraphQL */ `
  mutation RevokeCustomerToken {
    revokeCustomerToken {
      result
    }
  }
`;

export const REQUEST_PASSWORD_RESET_EMAIL_MUTATION = /* GraphQL */ `
  mutation RequestPasswordResetEmail($email: String!) {
    requestPasswordResetEmail(email: $email)
  }
`;

export const RESET_PASSWORD_MUTATION = /* GraphQL */ `
  mutation ResetPassword($email: String!, $resetPasswordToken: String!, $newPassword: String!) {
    resetPassword(
      email: $email
      resetPasswordToken: $resetPasswordToken
      newPassword: $newPassword
    )
  }
`;

export const CHANGE_CUSTOMER_PASSWORD_MUTATION = /* GraphQL */ `
  mutation ChangeCustomerPassword($currentPassword: String!, $newPassword: String!) {
    changeCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      id
      email
    }
  }
`;

export const SEND_OTP_TO_CUSTOMER_MUTATION = /* GraphQL */ `
  mutation SendOtpToCustomer($resend: Int!, $storeId: Int!, $mobile: String!, $eventType: String!) {
    sendOtpToCustomer(resend: $resend, storeId: $storeId, mobile: $mobile, eventType: $eventType) {
      message
    }
  }
`;

export const CREATE_CUSTOMER_TOKEN_WITH_OTP_MUTATION = /* GraphQL */ `
  mutation CreateCustomerTokenWithOtp($mobile: String!, $otp: String!, $websiteId: Int!) {
    createCustomerTokenWithOtp(mobile: $mobile, otp: $otp, websiteId: $websiteId) {
      message
      token
    }
  }
`;

export const INITIATE_PASSWORD_RESET_WITH_OTP_MUTATION = /* GraphQL */ `
  mutation InitiatePasswordResetWithOtp($mobile: String!, $otp: String!, $template: String!, $websiteId: Int!) {
    initiatePasswordResetWithOTP(
      mobile: $mobile
      otp: $otp
      template: $template
      websiteId: $websiteId
    ) {
      message
    }
  }
`;

export const CONTACT_US_MUTATION = /* GraphQL */ `
  mutation ContactUs($input: ContactUsInput!) {
    contactUs(input: $input) {
      status
    }
  }
`;

export const CREATE_CUSTOMER_ADDRESS_MUTATION = /* GraphQL */ `
  mutation CreateCustomerAddress($input: CustomerAddressInput!) {
    createCustomerAddress(input: $input) {
      id
      firstname
      lastname
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
`;

// Native Magento profile update (firstname/lastname/email). updateCustomer(input: CustomerInput)
// → CustomerOutput { customer }. Works through /graphql (no REST). Note: changing `email` may
// require `password` in the input depending on store config — the route passes it through if sent.
export const UPDATE_CUSTOMER_MUTATION = /* GraphQL */ `
  mutation UpdateCustomer($input: CustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        firstname
        lastname
        email
      }
    }
  }
`;

// Native Magento wishlist add/remove — back the GraphQL /favorite-products write paths.
// addProductsToWishlist needs a SKU (WishlistItemInput.sku is required); remove takes the
// wishlist ITEM id (items_v2.items[].id), not the product id.
export const ADD_PRODUCTS_TO_WISHLIST_MUTATION = /* GraphQL */ `
  mutation AddProductsToWishlist($wishlistId: ID!, $items: [WishlistItemInput!]!) {
    addProductsToWishlist(wishlistId: $wishlistId, wishlistItems: $items) {
      wishlist { id items_count }
      user_errors { code message }
    }
  }
`;

export const REMOVE_PRODUCTS_FROM_WISHLIST_MUTATION = /* GraphQL */ `
  mutation RemoveProductsFromWishlist($wishlistId: ID!, $itemIds: [ID!]!) {
    removeProductsFromWishlist(wishlistId: $wishlistId, wishlistItemsIds: $itemIds) {
      wishlist { id items_count }
      user_errors { code message }
    }
  }
`;

export const UPDATE_CUSTOMER_ADDRESS_MUTATION = /* GraphQL */ `
  mutation UpdateCustomerAddress($id: Int!, $input: CustomerAddressInput!) {
    updateCustomerAddress(id: $id, input: $input) {
      id
      firstname
      lastname
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
`;

export const DELETE_CUSTOMER_ADDRESS_MUTATION = /* GraphQL */ `
  mutation DeleteCustomerAddress($id: Int!) {
    deleteCustomerAddress(id: $id)
  }
`;

// Schema: kleverCreateSubaccount(input: KleverSubaccountInput!) — single `input` object,
// NOT flat args. Input fields: email/firstname/lastname (String!), password/taxvat (String),
// is_active/permissions (Int — `permissions` is a power-of-two bitmask). Return omits the
// `permissions` field (backend types it [Int] but returns strings → execution error).
export const KLEVER_CREATE_SUBACCOUNT_MUTATION = /* GraphQL */ `
  mutation CreateSubaccount($input: KleverSubaccountInput!) {
    kleverCreateSubaccount(input: $input) {
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
  }
`;

// Schema: kleverUpdateSubaccount(subaccountId: Int!, input: KleverSubaccountInput!) — fields go
// inside `input` (snake_case; permissions is [Int]), NOT flat args. The route sends
// variables: { subaccountId, input }. (permissions is now [Int] on both input + output and
// resolves cleanly — the old [Int]-vs-string error is fixed backend-side.)
export const KLEVER_UPDATE_SUBACCOUNT_MUTATION = /* GraphQL */ `
  mutation UpdateSubaccount($subaccountId: Int!, $input: KleverSubaccountInput!) {
    kleverUpdateSubaccount(subaccountId: $subaccountId, input: $input) {
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

export const KLEVER_DELETE_SUBACCOUNT_MUTATION = /* GraphQL */ `
  mutation KleverDeleteSubaccount($subaccountId: Int!) {
    kleverDeleteSubaccount(subaccountId: $subaccountId) {
      success
      message
    }
  }
`;

// Log in as a subaccount (impersonate). Takes subaccountId: Int!. Returns
// KleverLoginResponse { token, customer } — token at the top level, which is where the
// subaccounts manage page reads it from. Minimal customer fields (the impersonated session
// re-fetches its own profile). Auth-changing → schema-validated only, NOT executed.
// (Previously selected invalid CustomerAddress fields like `is_default_billing` — fixed.)
export const KLEVER_LOGIN_AS_SUBACCOUNT_MUTATION = /* GraphQL */ `
  mutation KleverLoginAsSubaccount($subaccountId: Int!) {
    kleverLoginAsSubaccount(subaccountId: $subaccountId) {
      token
      customer {
        id
        email
        firstname
        lastname
      }
    }
  }
`;

export const UPDATE_CART_ITEMS_MUTATION = /* GraphQL */ `
  mutation UpdateCartItems($cartId: String!, $items: [CartItemUpdateInput!]!) {
    updateCartItems(input: { cart_id: $cartId, cart_items: $items }) {
      cart {
        id
        items {
          id
          quantity
        }
      }
    }
  }
`;

export const REMOVE_ITEM_FROM_CART_MUTATION = /* GraphQL */ `
  mutation RemoveItemFromCart($cartId: String!, $cartItemId: Int!) {
    removeItemFromCart(input: { cart_id: $cartId, cart_item_id: $cartItemId }) {
      cart {
        id
        items {
          id
          quantity
        }
      }
    }
  }
`;

export const APPLY_COUPON_TO_CART_MUTATION = /* GraphQL */ `
  mutation ApplyCouponToCart($cartId: String!, $couponCode: String!) {
    applyCouponToCart(input: { cart_id: $cartId, coupon_code: $couponCode }) {
      cart {
        applied_coupons {
          code
        }
        prices {
          grand_total { value currency }
          discounts {
            amount { value currency }
            label
          }
        }
      }
    }
  }
`;

export const REMOVE_COUPON_FROM_CART_MUTATION = /* GraphQL */ `
  mutation RemoveCouponFromCart($cartId: String!) {
    removeCouponFromCart(input: { cart_id: $cartId }) {
      cart {
        applied_coupons {
          code
        }
        prices {
          grand_total { value currency }
        }
      }
    }
  }
`;


export const KLEVER_UPLOAD_FORECAST_MUTATION = /* GraphQL */ `
  mutation KleverUploadForecast($fileName: String!, $fileContent: String!) {
    kleverUploadForecast(fileName: $fileName, fileContent: $fileContent) {
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

// Schema: kleverSubmitEnquiry(input: KleverEnquiryInput!): Boolean — single `input` object
// (snake_case fields: product_name!, product_sku!, qty!, comment, phone, notify_stock), NOT
// flat args; returns a scalar Boolean (no sub-selection). The route sends variables: { input }.
export const KLEVER_SUBMIT_ENQUIRY_MUTATION = /* GraphQL */ `
  mutation SubmitEnquiry($input: KleverEnquiryInput!) {
    kleverSubmitEnquiry(input: $input)
  }
`;

export const KLEVER_QUICK_ORDER_VALIDATE_MUTATION = /* GraphQL */ `
  mutation KleverQuickOrderValidate($items: [KleverQuickOrderItemInput!]!) {
    kleverQuickOrderValidate(items: $items) {
      grand_total
      items {
        sku
        name
        qty
        price
        row_total
        is_valid
        error_message
      }
    }
  }
`;

export const KLEVER_QUICK_ORDER_ADD_TO_CART_MUTATION = /* GraphQL */ `
  mutation KleverQuickOrderAddToCart($items: [KleverQuickOrderItemInput!]!) {
    kleverQuickOrderAddToCart(items: $items) {
      success
      message
      items_count
      grand_total
      redirect_url
    }
  }
`;

export const KLEVER_QUICK_ORDER_CHECKOUT_MUTATION = /* GraphQL */ `
  mutation KleverQuickOrderCheckout($items: [KleverQuickOrderItemInput!]!) {
    kleverQuickOrderCheckout(items: $items) {
      success
      message
      redirect_url
      items_count
      grand_total
    }
  }
`;

// Op is kleverQuickOrderClear (kleverQuickOrderClearAll does NOT exist on the schema).
export const KLEVER_QUICK_ORDER_CLEAR_ALL_MUTATION = /* GraphQL */ `
  mutation KleverQuickOrderClear {
    kleverQuickOrderClear {
      grand_total
      items {
        image_url
        item_id
        name
        pattern_display
        price
        product_id
        product_url
        qty
        row_total
        size_display
        sku
      }
      items_count
      message
      redirect_url
      success
    }
  }
`;

// Op is kleverQuickOrderRemove (kleverQuickOrderRemoveItem does NOT exist on the schema).
export const KLEVER_QUICK_ORDER_REMOVE_ITEM_MUTATION = /* GraphQL */ `
  mutation KleverQuickOrderRemove($sku: String!) {
    kleverQuickOrderRemove(sku: $sku) {
      success
      message
      items_count
      grand_total
      redirect_url
      items {
        sku
        name
        qty
        price
        row_total
      }
    }
  }
`;

// Op is kleverQuickOrderUpdateQty (kleverQuickOrderUpdateItemQty does NOT exist).
export const KLEVER_QUICK_ORDER_UPDATE_ITEM_QTY_MUTATION = /* GraphQL */ `
  mutation KleverQuickOrderUpdateQty($sku: String!, $qty: Float!) {
    kleverQuickOrderUpdateQty(sku: $sku, qty: $qty) {
      grand_total
      items {
        image_url
        item_id
        name
        pattern_display
        price
        product_id
        product_url
        qty
        row_total
        size_display
        sku
      }
      items_count
      message
      redirect_url
      success
    }
  }
`;

export const KLEVER_QUICK_ORDER_UPLOAD_CSV_MUTATION = /* GraphQL */ `
  mutation KleverQuickOrderUploadCsv($fileContent: String!) {
    kleverQuickOrderUploadCsv(fileContent: $fileContent) {
      grand_total
      items {
        sku
        name
        qty
        price
        is_valid
        error_message
      }
    }
  }
`;

// Schema op is kleverMarkNotificationRead (NOT ...AsRead). The route reads
// json.data.kleverMarkNotificationRead, so the field name here must match. Export const name
// kept for the route's existing import.
export const KLEVER_MARK_NOTIFICATION_AS_READ_MUTATION = /* GraphQL */ `
  mutation MarkNotificationRead($notificationId: Int!) {
    kleverMarkNotificationRead(notificationId: $notificationId) {
      success
      message
    }
  }
`;

export const KLEVER_REMOVE_NOTIFICATION_MUTATION = /* GraphQL */ `
  mutation KleverRemoveNotification($notificationId: Int!) {
    kleverRemoveNotification(notificationId: $notificationId) {
      success
      message
    }
  }
`;

export const KLEVER_ADD_FAVORITE_PRODUCT_MUTATION = /* GraphQL */ `
  mutation KleverAddFavoriteProduct($productId: Int!) {
    kleverAddFavoriteProduct(productId: $productId)
  }
`;

export const KLEVER_REMOVE_FAVORITE_PRODUCT_MUTATION = /* GraphQL */ `
  mutation KleverRemoveFavoriteProduct($productId: Int!) {
    kleverRemoveFavoriteProduct(productId: $productId)
  }
`;

export const KLEVER_CANCEL_ORDER_MUTATION = /* GraphQL */ `
  mutation KleverCancelOrder($orderId: Int!) {
    kleverCancelOrder(orderId: $orderId) {
      success
      message
      order_id
      order_increment_id
    }
  }
`;

export const KLEVER_CONFIRM_ORDER_MUTATION = /* GraphQL */ `
  mutation KleverConfirmOrder($orderId: Int!, $request: KleverConfirmOrderRequestInput!) {
    kleverConfirmOrder(orderId: $orderId, request: $request) {
      success
      message
      order_id
      order_increment_id
      attachments { attachment_id file_name file_url }
    }
  }
`;

export const REORDER_ITEMS_MUTATION = /* GraphQL */ `
  mutation ReorderItems($orderNumber: String!) {
    reorderItems(orderNumber: $orderNumber) {
      cart {
        id
        total_quantity
        items {
          quantity
          product { sku }
        }
      }
      userInputErrors { code message }
    }
  }
`;

export const SET_SHIPPING_ADDRESSES_ON_CART_MUTATION = /* GraphQL */ `
  mutation SetShippingAddressesOnCart($cartId: String!, $addressId: Int!) {
    setShippingAddressesOnCart(
      input: { cart_id: $cartId, shipping_addresses: [{ customer_address_id: $addressId }] }
    ) {
      cart {
        shipping_addresses {
          firstname
          lastname
          street
          city
          postcode
          telephone
          country { code label }
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
  }
`;

export const SET_SHIPPING_METHODS_ON_CART_MUTATION = /* GraphQL */ `
  mutation SetShippingMethodsOnCart($cartId: String!, $carrierCode: String!, $methodCode: String!) {
    setShippingMethodsOnCart(
      input: {
        cart_id: $cartId
        shipping_methods: [{ carrier_code: $carrierCode, method_code: $methodCode }]
      }
    ) {
      cart {
        shipping_addresses {
          selected_shipping_method {
            carrier_code
            method_code
            amount { value currency }
          }
        }
      }
    }
  }
`;

export const SET_PAYMENT_METHOD_ON_CART_MUTATION = /* GraphQL */ `
  mutation SetPaymentMethodOnCart($cartId: String!, $code: String!) {
    setPaymentMethodOnCart(input: { cart_id: $cartId, payment_method: { code: $code } }) {
      cart {
        selected_payment_method {
          code
          title
        }
      }
    }
  }
`;

export const PLACE_ORDER_MUTATION = /* GraphQL */ `
  mutation PlaceOrder($cartId: String!) {
    placeOrder(input: { cart_id: $cartId }) {
      order {
        order_number
      }
    }
  }
`;

export const KLEVER_CHECKOUT_SET_PO_NUMBER_MUTATION = /* GraphQL */ `
  mutation KleverSetPoNumber($poNumber: String!) {
    kleverSetPoNumber(poNumber: $poNumber)
  }
`;

export const KLEVER_CHECKOUT_SET_ORDER_COMMENT_MUTATION = /* GraphQL */ `
  mutation KleverSetOrderComment($comment: String!) {
    kleverSetOrderComment(comment: $comment)
  }
`;

export const KLEVER_CHECKOUT_PO_UPLOAD_MUTATION = /* GraphQL */ `
  mutation KleverUploadPoFile($fileName: String!, $fileContent: String!, $type: String) {
    kleverUploadPoFile(fileName: $fileName, fileContent: $fileContent, type: $type)
  }
`;

export const KLEVER_CHECKOUT_PO_REMOVE_FILE_MUTATION = /* GraphQL */ `
  mutation KleverRemovePoFile($fileName: String!) {
    kleverRemovePoFile(fileName: $fileName)
  }
`;

// Catalog op takes a single KleverShippingExtrasInput object (snake_case fields).
export const KLEVER_CHECKOUT_SET_SHIPPING_EXTRAS_MUTATION = /* GraphQL */ `
  mutation KleverSetShippingExtras($input: KleverShippingExtrasInput!) {
    kleverSetShippingExtras(input: $input)
  }
`;

export const KLEVER_ADD_PROMO_ITEMS_MUTATION = /* GraphQL */ `
  mutation KleverAddPromoItems($items: [KleverPromoItemRequestInput]!) {
    kleverAddPromoItems(items: $items) {
      success
      message
      total_discount
      grand_total
      applied_coupons {
        code
        rule_name
      }
    }
  }
`;

// The live schema takes a single input object — kleverUpdateBusinessOverview(input:
// KleverBusinessOverviewInput!) with snake_case fields: total_employees, trucks,
// annual_revenue, business_model, products_offered (all String). The previous const used
// flat args (and invalid // comments) which the schema rejects. Send ALL fields (even
// empty strings) — the resolver reads each without isset, so omitting one throws a PHP
// "Undefined index" notice.
export const KLEVER_UPDATE_BUSINESS_OVERVIEW_MUTATION = /* GraphQL */ `
  mutation UpdateBusinessOverview($input: KleverBusinessOverviewInput!) {
    kleverUpdateBusinessOverview(input: $input) {
      success
      message
    }
  }
`;

// ── Auth (OTP + mobile password reset) — Klever custom catalog ops ───────────
export const KLEVER_SEND_OTP_MUTATION = /* GraphQL */ `
  mutation KleverSendOtp($mobile: String!, $countryCode: String) {
    kleverSendOtp(mobile: $mobile, countryCode: $countryCode) {
      success
      message
      resend_count
    }
  }
`;

export const KLEVER_LOGIN_WITH_OTP_MUTATION = /* GraphQL */ `
  mutation KleverLoginWithOtp($mobile: String!, $otp: String!, $countryCode: String) {
    kleverLoginWithOtp(mobile: $mobile, otp: $otp, countryCode: $countryCode) {
      token
      customer { email firstname lastname }
    }
  }
`;

// Returns a reset token (String) to pass into kleverResetPasswordByMobile.
export const KLEVER_FORGET_PASSWORD_VERIFY_OTP_MUTATION = /* GraphQL */ `
  mutation KleverForgetPasswordVerifyOtp($mobile: String!, $otp: String!, $countryCode: String) {
    kleverForgetPasswordVerifyOtp(mobile: $mobile, otp: $otp, countryCode: $countryCode)
  }
`;

export const KLEVER_RESET_PASSWORD_BY_MOBILE_MUTATION = /* GraphQL */ `
  mutation KleverResetPasswordByMobile($resetToken: String!, $newPassword: String!, $confirmPassword: String!) {
    kleverResetPasswordByMobile(resetToken: $resetToken, newPassword: $newPassword, confirmPassword: $confirmPassword)
  }
`;

// Place order — Klever custom, token-based (NO cart_id). Shipping address/method
// must already be set on the quote via the prior checkout steps; this only takes
// the payment method. Returns the order summary the success page reads.
export const KLEVER_PLACE_ORDER_MUTATION = /* GraphQL */ `
  mutation KleverPlaceOrder($paymentMethod: String!) {
    kleverPlaceOrder(paymentMethod: $paymentMethod) {
      order_id
      order_increment_id
      grand_total
      currency_code
      status
    }
  }
`;

// Clear the customer's cart — Klever custom, token-based (no cart_id), returns Boolean.
export const KLEVER_CLEAR_CART_MUTATION = /* GraphQL */ `
  mutation KleverClearCart {
    kleverClearCart
  }
`;

// Create/ensure the customer's cart, returning its masked cart_id (String). For a
// logged-in customer this is idempotent — it returns the existing cart id without
// wiping items. Used as a fallback by getCustomerCartId() when none exists yet.
export const CREATE_EMPTY_CART_MUTATION = /* GraphQL */ `
  mutation CreateEmptyCart {
    createEmptyCart
  }
`;

// ─── Multi-shipping ───
// Start a multi-shipping checkout — switches the quote to multishipping mode and
// returns the per-item rows + the customer's saved addresses to populate the form.
// No args. Returns { success, items[{quote_item_id,name,sku,qty}],
// addresses[{customer_address_id,city,street,region,postcode,country_id}] }.
export const KLEVER_MULTISHIPPING_START_MUTATION = /* GraphQL */ `
  mutation KleverMultishippingStart {
    kleverMultishippingStart {
      success
      items {
        quote_item_id
        name
        sku
        qty
      }
      addresses {
        customer_address_id
        city
        street
        region
        postcode
        country_id
      }
    }
  }
`;

// Assign quote items to customer addresses for multi-shipping. input.assignments is a
// list of { quote_item_id: Int!, customer_address_id: Int!, qty: Float! }. Returns Boolean.
export const KLEVER_MULTISHIPPING_ASSIGN_MUTATION = /* GraphQL */ `
  mutation KleverMultishippingAssign($input: KleverMultishippingAssignInput!) {
    kleverMultishippingAssign(input: $input)
  }
`;

// Set the chosen shipping method per quote address for multi-shipping. input.methods is
// a list of { quote_address_id: Int!, carrier_code: String!, method_code: String! }.
// Returns Boolean.
export const KLEVER_MULTISHIPPING_SET_SHIPPING_METHODS_MUTATION = /* GraphQL */ `
  mutation KleverMultishippingSetShippingMethods($input: KleverMultishippingSetMethodsInput!) {
    kleverMultishippingSetShippingMethods(input: $input)
  }
`;

// Set the billing address for a multi-shipping checkout. Takes addressId: Int!.
// Returns Boolean. NOTE: the schema op has no payment-method argument — payment
// method is handled separately (place-order), so only addressId is forwarded.
export const KLEVER_MULTISHIPPING_SET_BILLING_ADDRESS_MUTATION = /* GraphQL */ `
  mutation KleverMultishippingSetBillingAddress($addressId: Int!) {
    kleverMultishippingSetBillingAddress(addressId: $addressId)
  }
`;

// Place a multi-shipping order. Takes paymentMethod: String! and optional
// agreementIds: [Int]. Returns { order_ids: [Int], increment_ids: [String], success }.
// In the GraphQL flow billing address + per-address shipping methods are set by the
// preceding mutations (kleverMultishippingSetBillingAddress / SetShippingMethods);
// this op only finalizes with the payment method + agreements.
export const KLEVER_MULTISHIPPING_PLACE_ORDER_MUTATION = /* GraphQL */ `
  mutation KleverMultishippingPlaceOrder($paymentMethod: String!, $agreementIds: [Int]) {
    kleverMultishippingPlaceOrder(paymentMethod: $paymentMethod, agreementIds: $agreementIds) {
      order_ids
      increment_ids
      success
    }
  }
`;
