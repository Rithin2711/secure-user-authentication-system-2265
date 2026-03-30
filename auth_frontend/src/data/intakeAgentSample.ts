/**
 * Sample intake-agent extracted JSON payload.
 * Used by UI-only pages (InputValidationPage, UploadPage) for demonstration.
 */

export const intakeAgentSample = {
  advertiser_and_product_information: {
    advertiser_name: 'Globex Media',
    agency_name: 'StarCom',
    billing_entity: ['CPM'],
    brand_name: 'Initech',
  },

  campaign_details: {
    campaign_name: 'Brand Refresh 2026',
    campaign_start_date: '04/12/2026',
    // Intentionally left empty to demonstrate required-field validation
    campaign_end_date: '',
    currency: 'USD',
    audience_segments: ['Age;20+'],
    additional_info: ['mid-roll'],
    ad_types: 'mid-roll',
    media_environment_ids: ['1(Linear)', '2(Digital)', '3(Hi-Tech)'],
    number_of_flight_codes: 3,
  },

  budget_and_financials: {
    budget_order_value: 900000,
    rate_card_agreed_rate: 700,
    linear_budget: 300000,
    digital_budget: 300000,
    catchup_budget: 300000,
  },

  linear_details: {
    channel_network: ['1 Magic'],
    ad_duration: 30,
    creative_id: 'GLOB/012/01/E/H',
    ad_file_asset_link: ['asset_link2.mp4'],
    number_of_packages: 1,
    package_catalog_ids: [10],
  },

  digital_details: {
    total_line_items: 3,
    number_of_spots: 5100,
    line_items: [
      {
        platform: 'Google',
        ad_unit: '18(Live Ad Insertion Mid Roll- Live Sport)',
        ad_file_asset_link: ['asset_link2.mp4'],
        creative_id: 'GLOB/012/01/E/H',
        line_item_quantity: 1700,
        line_item_scheduling_type: 'LIVE',
        devices: 'STREAMING',
        line_item_creative_type: '1;video',
        line_item_duration_sec: 30,
        billable_metric: 'CPM',
        deal_type: 'Programmatic (PG and PD)',
        calculated_rate: 1190,
      },
      {
        platform: 'Youtube',
        ad_unit: '32(Video Pre-roll – Unskip 20)',
        creative_id: 'NA',
        ad_file_asset_link: ['asset_link3.mp4'],
        line_item_quantity: 1700,
        line_item_scheduling_type: 'VOD',
        devices: 'MOBILE',
        line_item_creative_type: '2;Display',
        line_item_duration_sec: 30,
        billable_metric: 'CPM',
        deal_type: 'DR',
        calculated_rate: 1190,
      },
      {
        platform: 'Google',
        ad_unit: '12(Video Pre-roll – skip 20)',
        creative_id: 'GLOB/012/03/G/H',
        ad_file_asset_link: ['asset_link1.mp4'],
        line_item_quantity: 1700,
        line_item_scheduling_type: 'VOD',
        devices: 'MOBILE',
        line_item_creative_type: '1;video',
        line_item_duration_sec: 30,
        billable_metric: 'CPM',
        deal_type: 'Sponsorship',
        calculated_rate: 1190,
      },
    ],
  },
} as const;

/**
 * Required field paths used by InputValidationPage for HITL validation.
 */
export const requiredFieldPaths: string[] = [
  'advertiser_and_product_information.advertiser_name',
  'advertiser_and_product_information.agency_name',
  'advertiser_and_product_information.billing_entity',
  'advertiser_and_product_information.brand_name',

  'campaign_details.campaign_name',
  'campaign_details.campaign_start_date',
  'campaign_details.campaign_end_date',
  'campaign_details.currency',
  'campaign_details.media_environment_ids',
  'campaign_details.number_of_flight_codes',

  'budget_and_financials.budget_order_value',

  'linear_details.channel_network',
  'linear_details.ad_duration',
  'linear_details.creative_id',

  'digital_details.total_line_items',
  'digital_details.number_of_spots',
  'digital_details.line_items',
];
