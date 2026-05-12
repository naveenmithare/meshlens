export interface PlaygroundConfig {
  layout: "arc";
  layerColors: Record<string, string>;
  appTypeColors: Record<string, string>;
  green: string;
  red: string;
  warning: string;
  text: string;
  bg: string;
  /** Preferred whole-dashboard stage scale; still clamped to fit the current screen. */
  stageScaleFactor: number;
  radii: Record<string, number>;
  bubbleR: Record<string, number>;
  appDotR: number;
  cx: number;
  cy: number;
  pad: number;
  vw: number;
  vh: number;
  bizBubbleScale: number;
  conBubbleScale: number;
  innerDotR: number;
  bubbleGap: number;
  equalSpread: boolean;
  bubbleSizeMode: "uniform" | "upstream";
  uniformSrcR: number;
  uniformBizR: number;
  uniformConR: number;
  domainColors: Record<string, string>;
  domainBubbleOpacity: number;
  groupBubbleOpacity: number;
  outerBubbleOpacity: Record<string, number>;
  labelSize: number;
  domainNameSize: number;
  legendSize: number;
  labelOpacity: number;
  labelWeight: number;
  prodLabel: {
    srcSize: number; bizSize: number; conSize: number; offset: number; staggerGap: number; opacity: number; rotation: number;
    srcOffset: number; bizOffset: number; conOffset: number;
    srcAngle: number; bizAngle: number; conAngle: number;
    xOffset: number; yOffset: number;
    perProduct: Record<string, { radius: number; angle: number; x: number; y: number; rotation: number }>;
    labelArcGap: number; flipIndex: number; ringGap: number; ringStroke: number; ringFillOpacity: number;
  };
  show: { productLabels: boolean; layerLabels: boolean; domainNames: boolean; domainLegend: boolean; appTypeLegend: boolean; dataFlowArrow: boolean; separators: boolean; arcBands: boolean; flowAnimation: boolean; searchBar: boolean; smartLabels: boolean; productAnatomyLegend: boolean; dataFlowLegend: boolean; bubbleSizeLegend: boolean; flowStatusLegend: boolean; dragHandles: boolean; pipelineLegend: boolean };
  searchBarUi: {
    x: number; y: number;
    width: number; height: number;
    radius: number;
    fontSize: number;
    bg: string;
    border: string;
    text: string;
    placeholder: string;
    icon: string;
    shadow: number;
  };
  toggleBars: {
    minWidth: number;
    fontSize: number;
    iconSize: number;
    bg: string;
    borderColor: string;
    activeColor: string;
    inactiveColor: string;
    borderRadius: number;
    shadow: boolean;
  };
  selBubble: {
    bg: string;
    borderColor: string;
    borderWidth: number;
    shadow: boolean;
    size: number;
    defaultText: string;
    defaultFontSize: number;
    defaultColor: string;
    defaultFontWeight: number;
    defaultOpacity: number;
    selLabelFontSize: number;
    selLabelColor: string;
    selLabelOpacity: number;
    nameFontSize: number;
    nameColor: string;
    nameFontWeight: number;
    subtitleFontSize: number;
    subtitleColor: string;
    subtitleOpacity: number;
    textAlign: string;
    dotSize: number;
  };
  animationPaused: boolean;
  domainLabelPos: Record<string, { x: number; y: number }>;
  legendPos: { domain: { x: number; y: number }; appType: { x: number; y: number }; dataFlow: { x: number; y: number }; productAnatomy: { x: number; y: number }; bubbleSize: { x: number; y: number }; flowStatus: { x: number; y: number }; pipeline: { x: number; y: number } };
  /** Per arc layer label offset (SVG px); drag on-canvas or tune in playground */
  layerLabelPos: Partial<Record<"APPS" | "SOURCE_ALIGNED" | "BUSINESS" | "CONSUMER_ALIGNED", { x: number; y: number }>>;
  /** Legend typography & colors; empty string color uses main `text` */
  legendUi: {
    domainTitleSize: number; domainTitleColor: string; domainTitleOpacity: number; domainDividerOpacity: number;
    domainNameSize: number; domainNameColor: string; domainNameOpacity: number; domainNameOpacityHover: number;
    appTypeTitleSize: number; appTypeTitleColor: string; appTypeTitleOpacity: number; appTypeDividerOpacity: number; appTypeRowSize: number; appTypeRowColor: string; appTypeRowOpacity: number;
    dataFlowTitleSize: number; dataFlowTitleColor: string; dataFlowTitleOpacity: number; dataFlowDividerOpacity: number; dataFlowLineLabelSize: number; dataFlowLineLabelColor: string; dataFlowLineLabelOpacity: number;
    anatomyTitleSize: number; anatomyTitleColor: string; anatomyTitleOpacity: number; anatomyDividerOpacity: number; anatomyRowTitleSize: number; anatomyRowTitleColor: string; anatomyRowTitleOpacity: number;
    bubbleTitleSize: number; bubbleSubtitleSize: number; bubbleTitleColor: string; bubbleSubtitleColor: string; bubbleTitleOpacity: number; bubbleSubtitleOpacity: number; bubbleSampleSmallR: number; bubbleSampleLargeR: number;
    dataFlowArrowOpacity: number; dataFlowArrowStrokeWidth: number;
  };
  arrowPos: { x: number; y: number };
  legendScale: number;
  appCategoryShapes: Record<string, "circle" | "hexagon" | "square" | "diamond">;
  customTexts: Array<{ id: string; text: string; x: number; y: number; fontSize: number; color: string; fontWeight: number; opacity: number; width: number; lineHeight: number; textAlign: "left" | "center" | "right" | "justify" | "start" | "end" }>;
  typoOffset: { layerX: number; layerY: number; domainX: number; domainY: number; legendX: number; legendY: number };
  separator: { color: string; opacity: number; width: number; dash: number };
  arcBand: { opacity: number; width: number };
  flow: {
    width: number; opacity: number; highlightWidth: number; curveTension: number;
    issueBoostOpacity: number; issueBoostWidth: number;
    idleStyle: "dot" | "glow" | "arrow" | "diamond" | "dash" | "pulse" | "ripple" | "spark" | "trail" | "wave" | "morse" | "comet" | "none";
    idleSpeed: number;
    statusOverrides: Record<"healthy" | "broken" | "warning", { color: string; width: number; opacity: number; animation: boolean; idleStyle: string }>;
    anchor: { upstream: Record<string, number>; downstream: Record<string, number> };
    noodle: {
      appSourceCorridor: number;
      appSourceSpread: number;
      sourceBusinessCorridor: number;
      sameLayerGapFactor: number;
      sameLayerBase: number;
      sameLayerScale: number;
      sameLayerNearSpread: number;
      sameLayerFarSpread: number;
      businessBusinessLiftBase: number;
      businessBusinessLiftScale: number;
      businessBusinessLiftMax: number;
      businessBusinessNearSpread: number;
      businessBusinessFarSpread: number;
      farSpanThreshold: number;
      businessConsumerLiftBase: number;
      businessConsumerLiftScale: number;
      businessConsumerLiftMax: number;
      businessConsumerNearSpread: number;
      businessConsumerFarSpread: number;
    };
  };
  arrowX: number;
  arrowY: number;
  arrowRotation: number;
  arrowLength: number;
  legendText: {
    appTitle: string;
    domainTitle: string;
    dataFlowTitle: string;
    dataFlowArrowLabel: string;
    productLayersTitle: string;
    bubbleSizeTitle: string;
    /** If empty, a default is derived from bubble size mode */
    bubbleSizeSubtitle: string;
    anatomyRows: Partial<Record<"APPS" | "SOURCE_ALIGNED" | "BUSINESS" | "CONSUMER_ALIGNED", { label: string }>>;
    pipelineHealthy: string;
    pipelineBroken: string;
    pipelineWarning: string;
    appTypeLabels: Record<string, string>;
  };
  customSeparators: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; color: string; width: number; opacity: number; dash: number }>;
  panelBg: string;
  panelGradient: { enabled: boolean; type: "linear" | "radial"; color1: string; color2: string; color3: string; midStop: number; angle: number; opacity: number };
  paneBorder: { color: string; width: number; radius: number; padTop: number; padBottom: number; padSide: number };
  sortMode: "custom" | "alpha" | "appCount" | "upstream";
  arrowColor: string;
  /** Copy header typography (and optional widget shell) from one right-hand tab to the others */
  panelSync: { sourcePanel: "overview" | "cost" | "catalogue" | "quality" | "pipeline"; includeWidgetShell: boolean };
  tabDock: { bg: string; activeColor: string; inactiveColor: string; textActive: string; textInactive: string; iconSize: number; circleSize: number; gap: number };
  costPanel: {
    widgetBg: string;
    widgetBorder: string;
    widgetRadius: number;
    sectionGap: number;
    titleSize: number;
    banSize: number;
    labelSize: number;
    tabSize: number;
    barHeight: number;
    chartHeight: number;
    chartPadLeft: number;
    chartPadBottom: number;
    lineWidth: number;
    dotRadius: number;
    dotFill: string;
    dotStrokeWidth: number;
    mutedColor: string;
    posColor: string;
    negColor: string;
    chartLineColor: string;
    chartAreaColor: string;
    chartAreaOpacity: number;
    chartGridColor: string;
    chartGridWidth: number;
    chartAxisFontSize: number;
    chartAxisColor: string;
    chartMonthFontSize: number;
    chartMonthColor: string;
    chartDotStrokeColor: string;
    chartPadTop: number;
    chartPadRight: number;
    tableFontSize: number;
    tableMaxHeight: number;
    tableHeaderBg: string;
    tableHeaderColor: string;
    catIngestionColor: string;
    catProcessingColor: string;
    catOrchestrationColor: string;
    catStorageColor: string;
    selTitleSize: number;
    selBanSize: number;
    selLabelSize: number;
    selMutedColor: string;
    selBarHeight: number;
    selCatLabelSize: number;
    selTrendTabSize: number;
    selAppNameSize: number;
    selAppCostSize: number;
    selChartGridColor: string;
    selChartAxisColor: string;
    selChartMonthColor: string;
    selChartLineColor: string;
    selChartAreaOpacity: number;
    selChartLineWidth: number;
    selChartDotRadius: number;
    selChartAxisFontSize: number;
    selChartMonthFontSize: number;
    /** Selected-product “Cost Trend” SVG layout (matches main mesh chart when tuned similarly) */
    selChartWidth: number;
    selChartHeight: number;
    selChartPadLeft: number;
    selChartPadRight: number;
    selChartPadTop: number;
    selChartPadBottom: number;
    selChartGridLineWidth: number;
    selChartDotStrokeWidth: number;
    selChartDotFill: string;
    selTitleColor: string;
    selMutedOverride: string;
    /** No product selected — extra typography */
    nsPageTitleColor: string;
    nsCaptionSize: number;
    nsVsLabelSize: number;
    nsDeltaSize: number;
    nsTrendTotalSize: number;
    nsTrendYearSize: number;
    nsTableDomainSize: number;
    nsSortBtnSize: number;
    /** Selected product — inner cards (defaults match overview sel cards) */
    selWidgetBg: string;
    selWidgetBorder: string;
    /** Vertical gap between blocks when a product is selected */
    selSectionGap: number;
  };
  overviewPanel: {
    typeBubbleSize: number;
    typeAppDotR: number;
    domainBubbleSize: number;
    domainAppDotR: number;
    productDotR: number;
    dotActiveOpacity: number;
    dotSpacing: number;
    cardBg: string;
    cardBorder: string;
    cardRadius: number;
    cardShadow: boolean;
    sectionGap: number;
    titleSize: number;
    banSize: number;
    labelSize: number;
    gaugeSize: number;
    barHeight: number;
    tabBg: string;
    tabTextColor: string;
    tabInactiveColor: string;
    tabFontSize: number;
    domainOutlineWidth: number;
    domainFillOpacity: number;
    domainCircleGap: number;
    domainLabelColor: string;
    domainLabelSize: number;
    countSize: number;
    kpiIconBgOpacity: number;
    kpiNumberColor: string;
    kpiLabelColor: string;
    selBannerNameSize: number;
    selBannerDescSize: number;
    selBannerLabelSize: number;
    selKpiValueSize: number;
    selKpiLabelSize: number;
    selSectionHeaderSize: number;
    selItemNameSize: number;
    selItemDotSize: number;
    selLayerLabelSize: number;
    selCardRadius: number;
    selCardBg: string;
    selCardBorder: string;
    selSectionGap: number;
    selStarSize: number;
    selDomainSize: number;
    selBannerOverlineColor: string;
    selBannerTitleColor: string;
    selBannerDescColor: string;
    selBannerPillTextColor: string;
    selBannerDomainTextColor: string;
    selKpiQualityValueColor: string;
    selKpiQualityLabelColor: string;
    selKpiRatingValueColor: string;
    selKpiRatingLabelColor: string;
    selKpiSlaValueColor: string;
    selKpiSlaLabelColor: string;
    selLineageSectionTitleColor: string;
    selLineageItemTextColor: string;
    selClearLinkColor: string;
    /** No product selected — page header */
    nsPageTitleSize: number;
    nsPageSubtitleSize: number;
    nsPageTitleColor: string;
    nsPageSubtitleColor: string;
    /** No selection — "Mesh Entities" card */
    nsEntitiesTitleSize: number;
    nsEntitiesSubtitleSize: number;
    nsEntitiesTitleColor: string;
    nsEntitiesSubtitleColor: string;
    nsKpiIconBox: number;
    nsKpiIconSvg: number;
    kpiDotSize: number;
    kpiDotGap: number;
    activeTint: string;
    brokenTint: string;
  };
  cataloguePanel: {
    widgetBg: string;
    widgetBorder: string;
    widgetRadius: number;
    sectionGap: number;
    titleSize: number;
    subtitleSize: number;
    headerTextColor: string;
    headerSubColor: string;
    tabHeight: number;
    tabRadius: number;
    tabActiveTextColor: string;
    tabInactiveTextColor: string;
    tabFontSize: number;
    gridCols: number;
    gridGap: number;
    listMaxHeight: number;
    cardBg: string;
    cardBorder: string;
    cardRadius: number;
    cardShadow: boolean;
    cardHoverBg: string;
    bannerHeight: number;
    cardNameSize: number;
    cardNameColor: string;
    cardDescSize: number;
    descColor: string;
    cardMetaSize: number;
    metaColor: string;
    tagBg: string;
    tagColor: string;
    tagFontSize: number;
    tagRadius: number;
    tabCountSize: number;
    showBanner: boolean;
    searchBg: string;
    searchBorder: string;
    searchTextColor: string;
    searchPlaceholderColor: string;
    searchFontSize: number;
    searchRadius: number;
    searchHeight: number;
    starSize: number;
    domainDotSize: number;
    separatorColor: string;
    infoIconSize: number;
    infoIconBg: string;
    infoIconActiveBg: string;
    infoIconColor: string;
    infoIconActiveColor: string;
    rubricWidth: number;
    rubricTitleSize: number;
    rubricStarSize: number;
    rubricLabelSize: number;
    rubricDescSize: number;
    selBannerNameSize: number;
    selBannerDescSize: number;
    selBannerLabelSize: number;
    selStarSize: number;
    selDetailLabelSize: number;
    selDetailValueSize: number;
    selDetailIconSize: number;
    selScorecardLabelSize: number;
    selScorecardValueSize: number;
    selScorecardBarHeight: number;
    selBannerTitleColor: string;
    selBannerDescColor: string;
    selBannerLabelColor: string;
    selBannerIconStroke: string;
    selDetailLabelColor: string;
    selDetailValueColor: string;
    selDetailSectionTitleColor: string;
    selDetailIconStroke: string;
    selScorecardTitleColor: string;
    selScorecardIconStroke: string;
    selScorecardAvgColor: string;
    /** Selected product — vertical gap between banner / details / scorecard */
    selSectionGap: number;
    selHeroRadius: number;
    selHeroPadding: number;
    selHeroDecorOpacity: number;
    selCardRadius: number;
    selCardShadow: boolean;
    selCardBodyPadding: number;
    selCardHeaderPadX: number;
    selCardHeaderPadY: number;
    /** Layer-color tint strength (%) for borders and tinted surfaces */
    selTintCardBorder: number;
    selTintHeaderBg: number;
    selTintHeaderRule: number;
    selTintRowRule: number;
    selTintIconBg: number;
    selScorecardBodyPadding: number;
    selScorecardGridGap: number;
    /** Selected product — card shell (defaults match overview sel cards) */
    selWidgetBg: string;
    selWidgetBorder: string;
    /** Layer tab icon box (no selection) */
    nsTabIconWrap: number;
    nsTabIconSvg: number;
    cardPadding: number;
    rubricBg: string;
    rubricBorder: string;
  };
  qualityPanel: {
    widgetBg: string;
    widgetBorder: string;
    widgetRadius: number;
    sectionGap: number;
    titleSize: number;
    subtitleSize: number;
    headerTextColor: string;
    headerSubColor: string;
    radarSize: number;
    radarFillOpacity: number;
    radarStrokeWidth: number;
    radarGridColor: string;
    radarLabelSize: number;
    radarValueSize: number;
    radarDotRadius: number;
    radarCenterScoreSize: number;
    radarCenterLabelSize: number;
    radarLabelColor: string;
    radarAxisWidth: number;
    radarLabelGap: number;
    radarLabelOffset: number;
    /** Extra radial distance (px) for the Consistency vertex label to clear the chart */
    radarConsistencyLabelOutset: number;
    starMeaningSize: number;
    qualityHighColor: string;
    qualityMidColor: string;
    qualityLowColor: string;
    dimBarHeight: number;
    dimLabelSize: number;
    dimValueSize: number;
    dimDescSize: number;
    dimIconColor: string;
    inspectTextSize: number;
    starSize: number;
    starScoreSize: number;
    layerPillSize: number;
    cardBg: string;
    cardBorder: string;
    cardRadius: number;
    methodTextSize: number;
    methodTextColor: string;
    iconSize: number;
    promptTextSize: number;
    insightsMaxHeight: number;
    insightsBg: string;
    insightsBorder: string;
    insightsPassingBg: string;
    insightsAttentionBg: string;
    selHeaderTitleColor: string;
    selHeaderSubtitleColor: string;
    selProductBarTextColor: string;
    selInsightsTitleColor: string;
    selInsightsHintColor: string;
    selInsightsPassingHeaderColor: string;
    selInsightsAttentionHeaderColor: string;
    selInsightsStrongDimLabelColor: string;
    selClearLinkColor: string;
    /** Selected product — radar widget shell */
    selWidgetBg: string;
    selWidgetBorder: string;
    /** “Data Quality” title inside radar box (selected product) */
    selRadarHeaderSize: number;
    /** Vertical gap between blocks when a product is selected */
    selSectionGap: number;
    /** Insights drill-down overlay typography */
    drillTitleSize: number;
    drillDescSize: number;
    drillCloseSize: number;
    drillKpiValueSize: number;
    drillKpiLabelSize: number;
    drillSectionHeaderSize: number;
    drillFailureNameSize: number;
    drillFailureIssueSize: number;
    drillEmptyStateSize: number;
    /** No product selected — explainer + search */
    nsEmptyHeadingSize: number;
    nsEmptyHeadingColor: string;
    nsEmptyBodySize: number;
    nsEmptyRadarLegendSize: number;
    nsEmptySearchSize: number;
    maxHeight: number;
  };
  pipelinePanel: {
    widgetBg: string;
    widgetBorder: string;
    widgetRadius: number;
    sectionGap: number;
    titleSize: number;
    subtitleSize: number;
    headerTextColor: string;
    headerSubColor: string;
    tabHeight: number;
    tabRadius: number;
    tabFontSize: number;
    tabActiveTextColor: string;
    tabInactiveTextColor: string;
    tabIconSize: number;
    tabCountSize: number;
    cardBg: string;
    cardBorder: string;
    cardRadius: number;
    kpiFontSize: number;
    kpiLabelSize: number;
    prodNameSize: number;
    prodMetaSize: number;
    statusDotSize: number;
    statusBadgeSize: number;
    modelNameSize: number;
    tableHeaderSize: number;
    tableDataSize: number;
    sectionHeaderSize: number;
    logSeveritySize: number;
    logMessageSize: number;
    logTimeSize: number;
    logBadgeSize: number;
    logIconSize: number;
    logSevBadgeSize: number;
    archLabelSize: number;
    archSubSize: number;
    archMaxInputs: number;
    banDescSize: number;
    searchBg: string;
    searchBorder: string;
    searchFontSize: number;
    /** Product selected — outer widget / lineage boxes / models table */
    selWidgetBg: string;
    selWidgetBorder: string;
    selBoxBg: string;
    selBoxBorder: string;
    selTableBg: string;
    selTableHeaderBg: string;
    selTableBorder: string;
    /** Selected product — models table / logs list max height */
    selModelTableMaxHeight: number;
    selLogMaxHeight: number;
    /** Vertical gap when a product is focused */
    selSectionGap: number;
    /** Upstream / Downstream section titles (selected product) */
    selLineageTitleSize: number;
    selLineageTitleColor: string;
    selLineageChevronColor: string;
    /** No product selected — BAN tab row */
    nsBanTabFontSize: number;
    flowNodeSize: number;
    flowArrowColor: string;
  };
}

export const APP_CATEGORIES = ["SaaS", "Database", "API", "Streaming"] as const;

export const DEFAULTS: PlaygroundConfig = {
    layout: "arc" as const,
    layerColors: {
      APPS: "#000000",
      SOURCE_ALIGNED: "#f8b36d",
      BUSINESS: "#7db046",
      CONSUMER_ALIGNED: "#f95b10",
    },
    appTypeColors: {
      SaaS: "#454340",
      Database: "#454340",
      API: "#454340",
      Streaming: "#454340",
      CRM: "#000000",
      ERP: "#000000",
      STREAMING: "#000000",
      ANALYTICS: "#000000",
      DEVTOOLS: "#000000",
      DATABASE: "#000000",
      HRIS: "#000000",
    },
    green: "#4acdca",
    red: "#f042a7",
    warning: "#c8a637",
    text: "#000000",
    bg: "#fffef5",
    stageScaleFactor: 1,
    radii: {
      APPS: 665,
      SOURCE_ALIGNED: 530,
      BUSINESS: 385,
      CONSUMER_ALIGNED: 240,
    },
    bubbleR: {
      SOURCE_ALIGNED: 6.5,
      BUSINESS: 4,
      CONSUMER_ALIGNED: 6,
    },
    appDotR: 3.5,
    cx: 695,
    cy: 920,
    pad: 0.06,
    vw: 1400,
    vh: 900,
    bizBubbleScale: 0.9,
    conBubbleScale: 0.9,
    innerDotR: 3.5,
    bubbleGap: 0,
    equalSpread: true,
    bubbleSizeMode: "upstream",
    uniformSrcR: 9,
    uniformBizR: 18,
    uniformConR: 20,
    domainColors: {
      Finance: "#454340",
      HR: "#454340",
      Marketing: "#454340",
      Product: "#454340",
      Sales: "#454340",
      "Supply Chain": "#454340",
      Support: "#454340",
    },
    domainBubbleOpacity: 0.06,
    groupBubbleOpacity: 0.16,
    outerBubbleOpacity: {
      SOURCE_ALIGNED: 0.8,
      BUSINESS: 0.7,
      CONSUMER_ALIGNED: 0.7,
    },
    labelSize: 9.5,
    domainNameSize: 10.5,
    legendSize: 8.5,
    labelOpacity: 1,
    labelWeight: 800,
    prodLabel: {
      srcSize: 9,
      bizSize: 8.5,
      conSize: 8.5,
      offset: 0,
      staggerGap: 0,
      opacity: 1,
      rotation: 0,
      srcOffset: 0,
      bizOffset: 0,
      conOffset: 0,
      srcAngle: -22,
      bizAngle: -22,
      conAngle: -22,
      xOffset: 37,
      yOffset: 3,
      perProduct: {
        "biz-account-hierarchy": {
          radius: 4,
          angle: -13,
          x: -75,
          y: -31.9,
          rotation: 156,
        },
        "biz-attribution": {
          radius: 1,
          angle: -13,
          x: -69.5,
          y: -42.4,
          rotation: 144,
        },
        "biz-campaign-perf": {
          radius: 1,
          angle: -6,
          x: -75.8,
          y: -38.1,
          rotation: 150,
        },
        "biz-contract-lifecycle": {
          radius: 0,
          angle: -10,
          x: -81.8,
          y: -20.4,
          rotation: 167,
        },
        "biz-customer-360": {
          radius: 6,
          angle: -2,
          x: -74.6,
          y: -28.2,
          rotation: 169,
        },
        "biz-customer-health": {
          radius: 0,
          angle: -10,
          x: 15.6,
          y: -30.3,
          rotation: -12,
        },
        "biz-dev-velocity": {
          radius: 9,
          angle: -37,
          x: -7.6,
          y: -40,
          rotation: 30,
        },
        "biz-employee-lifecycle": {
          radius: 3,
          angle: -9,
          x: 0.1,
          y: -34.5,
          rotation: 0,
        },
        "biz-headcount": {
          radius: 2,
          angle: -11,
          x: 6.2,
          y: -41.5,
          rotation: 9,
        },
        "biz-incident-metrics": {
          radius: 4,
          angle: -13,
          x: -10,
          y: -36.8,
          rotation: 18,
        },
        "biz-order-fulfillment": {
          radius: 4,
          angle: -14,
          x: -2,
          y: -41.1,
          rotation: 10,
        },
        "biz-pipeline-forecast": {
          radius: 2,
          angle: -12,
          x: -76.5,
          y: -31.8,
          rotation: 162,
        },
        "biz-product-catalog": {
          radius: 4,
          angle: -9,
          x: -2.7,
          y: -44.4,
          rotation: 38,
        },
        "biz-product-usage": {
          radius: 5,
          angle: -19,
          x: -64.4,
          y: -42.7,
          rotation: 143,
        },
        "biz-recruiting-funnel": {
          radius: 3,
          angle: -6,
          x: -2.3,
          y: -26.7,
          rotation: -4,
        },
        "biz-revenue-ledger": {
          radius: 0,
          angle: -12,
          x: -86.6,
          y: -21.1,
          rotation: -177,
        },
        "biz-spend-analytics": {
          radius: 4,
          angle: -11,
          x: -76.8,
          y: -19.8,
          rotation: 178,
        },
        "biz-support-metrics": {
          radius: 5,
          angle: -3,
          x: 1.3,
          y: -24.4,
          rotation: -9,
        },
        "biz-unit-economics": {
          radius: 5,
          angle: -6,
          x: -73.6,
          y: -17.7,
          rotation: 171,
        },
        "biz-vendor-performance": {
          radius: 4,
          angle: -11,
          x: 4,
          y: -34.8,
          rotation: 9,
        },
        "con-board-deck": {
          radius: 3,
          angle: -6,
          x: -81.2,
          y: -19.1,
          rotation: 172,
        },
        "con-ceo-dashboard": {
          radius: 4,
          angle: -6,
          x: -86.7,
          y: -16.1,
          rotation: -180,
        },
        "con-churn-model": {
          radius: 1,
          angle: -10,
          x: 6.6,
          y: -42.4,
          rotation: 29,
        },
        "con-demand-forecast": {
          radius: 0,
          angle: -3,
          x: 2.4,
          y: -28.9,
          rotation: 16,
        },
        "con-eng-health": {
          radius: 4,
          angle: -9,
          x: 6.5,
          y: -37.8,
          rotation: 20,
        },
        "con-finance-close": {
          radius: 2,
          angle: -12,
          x: -91,
          y: -26.3,
          rotation: 164,
        },
        "con-marketing-roi": {
          radius: 2,
          angle: -11,
          x: 3.4,
          y: -42.6,
          rotation: 41,
        },
        "con-renewal-dashboard": {
          radius: 6,
          angle: -2,
          x: -80.7,
          y: -32.7,
          rotation: 141,
        },
        "con-revenue-monitor": {
          radius: 0,
          angle: -12,
          x: -88.4,
          y: -29.2,
          rotation: 153,
        },
        "con-sales-leaderboard": {
          radius: 1,
          angle: -1,
          x: -82.1,
          y: -29.3,
          rotation: 149,
        },
        "con-support-dashboard": {
          radius: 1,
          angle: -11,
          x: 16.1,
          y: -28.8,
          rotation: -9,
        },
        "con-talent-insights": {
          radius: 3,
          angle: -11,
          x: 9.9,
          y: -34,
          rotation: -4,
        },
        "con-upsell-signals": {
          radius: 4,
          angle: -5,
          x: -80.9,
          y: -36.4,
          rotation: 134,
        },
        "con-vendor-risk": {
          radius: 0,
          angle: -7,
          x: 3.6,
          y: -30.5,
          rotation: 7,
        },
        "src-amplitude-raw": {
          radius: -1,
          angle: 13,
          x: -30.2,
          y: -27.1,
          rotation: 10,
        },
        "src-anaplan-raw": {
          radius: 7,
          angle: -54,
          x: -51.8,
          y: -27.6,
          rotation: -118,
        },
        "src-avalara-raw": {
          radius: 80,
          angle: -44,
          x: 10.1,
          y: -64.9,
          rotation: -125,
        },
        "src-bamboohr-raw": {
          radius: 2,
          angle: -9,
          x: -14.5,
          y: -9.5,
          rotation: 39,
        },
        "src-braze-raw": {
          radius: 3,
          angle: -2,
          x: -29,
          y: -17.9,
          rotation: -159,
        },
        "src-clari-raw": {
          radius: 4,
          angle: -14,
          x: -39.2,
          y: -16.8,
          rotation: -154,
        },
        "src-clickstream": {
          radius: 3,
          angle: -4,
          x: -27.5,
          y: -31.2,
          rotation: 27,
        },
        "src-confluence-raw": {
          radius: 4,
          angle: -10,
          x: -12.4,
          y: -5.9,
          rotation: 33,
        },
        "src-contentful-raw": {
          radius: 0,
          angle: -5,
          x: -32.5,
          y: -29.1,
          rotation: -158,
        },
        "src-coupa-raw": {
          radius: 10,
          angle: -9,
          x: -41.3,
          y: -15.9,
          rotation: -155,
        },
        "src-cpq-raw": {
          radius: 3,
          angle: -2,
          x: -40.3,
          y: -12.3,
          rotation: -180,
        },
        "src-cultureamp-raw": {
          radius: 2,
          angle: -11,
          x: -15.4,
          y: -9.3,
          rotation: 40,
        },
        "src-datadog-raw": {
          radius: 2,
          angle: -3,
          x: -20.4,
          y: -17.6,
          rotation: 30,
        },
        "src-deel-raw": {
          radius: 1,
          angle: -9,
          x: -23.9,
          y: -5.4,
          rotation: 41,
        },
        "src-docusign-raw": {
          radius: 4,
          angle: -7,
          x: -43.8,
          y: -21.1,
          rotation: -168,
        },
        "src-fourkites-raw": {
          radius: 1,
          angle: -4,
          x: -18.5,
          y: -12.8,
          rotation: 34,
        },
        "src-ga4-raw": {
          radius: 4,
          angle: -64,
          x: -30.1,
          y: -31.4,
          rotation: -92,
        },
        "src-github-raw": {
          radius: 5,
          angle: -4,
          x: -26.7,
          y: -20.9,
          rotation: 25,
        },
        "src-gong-raw": {
          radius: 4,
          angle: -7,
          x: -42.5,
          y: -16.7,
          rotation: -164,
        },
        "src-google-ads": {
          radius: 3,
          angle: -5,
          x: -45.8,
          y: -23.4,
          rotation: -169,
        },
        "src-greenhouse-raw": {
          radius: -1,
          angle: 3,
          x: -13.8,
          y: -15.7,
          rotation: 32,
        },
        "src-hubspot-raw": {
          radius: 8,
          angle: -16,
          x: -45.8,
          y: -21.3,
          rotation: -154,
        },
        "src-intercom-raw": {
          radius: 1,
          angle: 2,
          x: -16.7,
          y: -9.8,
          rotation: 28,
        },
        "src-iterable-raw": {
          radius: 0,
          angle: -4,
          x: -31.3,
          y: -24.3,
          rotation: -158,
        },
        "src-jira-raw": {
          radius: 1,
          angle: -9,
          x: -25,
          y: -18.2,
          rotation: 35,
        },
        "src-kafka-inventory": {
          radius: 3,
          angle: -5,
          x: -9,
          y: -22.3,
          rotation: 36,
        },
        "src-kafka-orders": {
          radius: 2,
          angle: -12,
          x: -7.9,
          y: -22.5,
          rotation: 44,
        },
        "src-kinaxis-raw": {
          radius: 2,
          angle: -3,
          x: -27.4,
          y: -10.9,
          rotation: 26,
        },
        "src-lattice-raw": {
          radius: 2,
          angle: -5,
          x: -20.5,
          y: -5.7,
          rotation: 41,
        },
        "src-launchdarkly-raw": {
          radius: -3,
          angle: -5,
          x: -17.6,
          y: -36.1,
          rotation: 33,
        },
        "src-linkedin-ads-raw": {
          radius: 3,
          angle: 0,
          x: -41.4,
          y: -30.3,
          rotation: -167,
        },
        "src-marketo-raw": {
          radius: 4,
          angle: -10,
          x: -33.5,
          y: -21.3,
          rotation: -157,
        },
        "src-meta-ads": {
          radius: 4,
          angle: -14,
          x: -39.1,
          y: -25.7,
          rotation: -155,
        },
        "src-netsuite-raw": {
          radius: 8,
          angle: -4,
          x: -50.2,
          y: -15.9,
          rotation: -157,
        },
        "src-oracle-fin-raw": {
          radius: -5,
          angle: -81,
          x: -73.2,
          y: -18.5,
          rotation: -82,
        },
        "src-oracle-scm-raw": {
          radius: 1,
          angle: -14,
          x: -17,
          y: -15.1,
          rotation: 38,
        },
        "src-outreach-raw": {
          radius: 3,
          angle: -16,
          x: -49.3,
          y: -23.5,
          rotation: -150,
        },
        "src-pagerduty-raw": {
          radius: 3,
          angle: -11,
          x: -14.7,
          y: -27,
          rotation: 41,
        },
        "src-pendo-raw": {
          radius: 0,
          angle: -7,
          x: -20,
          y: -17.5,
          rotation: 30,
        },
        "src-postgres-raw": {
          radius: 9,
          angle: -8,
          x: -11.7,
          y: -17.7,
          rotation: 35,
        },
        "src-salesforce-raw": {
          radius: -5,
          angle: -21,
          x: -62.6,
          y: -23.5,
          rotation: -144,
        },
        "src-salesloft-raw": {
          radius: -1,
          angle: -6,
          x: -50.3,
          y: -22.4,
          rotation: -165,
        },
        "src-sap-raw": {
          radius: -28,
          angle: 39,
          x: -78.4,
          y: -24.5,
          rotation: 169,
        },
        "src-sap-scm-raw": {
          radius: -2,
          angle: -7,
          x: -22.4,
          y: -17.6,
          rotation: 35,
        },
        "src-segment-events": {
          radius: 5,
          angle: -11,
          x: -39.1,
          y: -32.4,
          rotation: -156,
        },
        "src-sfmc-raw": {
          radius: 0,
          angle: -8,
          x: -52.5,
          y: -25.6,
          rotation: -170,
        },
        "src-shipstation-raw": {
          radius: -1,
          angle: 1,
          x: -14.2,
          y: -16.8,
          rotation: 31,
        },
        "src-statuspage-raw": {
          radius: 1,
          angle: -6,
          x: -12.5,
          y: -8.9,
          rotation: 33,
        },
        "src-stripe-raw": {
          radius: -10,
          angle: 61,
          x: -59.6,
          y: -15.5,
          rotation: 142,
        },
        "src-surveymonkey-raw": {
          radius: 2,
          angle: -6,
          x: -4.8,
          y: -11.1,
          rotation: 26,
        },
        "src-wms-raw": {
          radius: 0,
          angle: -11,
          x: -7.6,
          y: -25.1,
          rotation: 41,
        },
        "src-workday-raw": {
          radius: 4,
          angle: -1,
          x: -20.2,
          y: -7.5,
          rotation: 37,
        },
        "src-zendesk-raw": {
          radius: 2,
          angle: -2,
          x: -16.7,
          y: -7.7,
          rotation: 30,
        },
        "src-zoominfo-raw": {
          radius: -1,
          angle: -8,
          x: -49.1,
          y: -23.4,
          rotation: -159,
        },
        "src-zuora-raw": {
          radius: 38,
          angle: -47,
          x: -24.6,
          y: -43.6,
          rotation: -127,
        },
      },
      labelArcGap: 18,
      flipIndex: 25,
      ringGap: 8,
      ringStroke: 1.1,
      ringFillOpacity: 0.95,
    },
    show: {
      productLabels: true,
      layerLabels: true,
      domainNames: true,
      domainLegend: false,
      appTypeLegend: true,
      dataFlowArrow: true,
      separators: false,
      arcBands: true,
      flowAnimation: true,
      searchBar: true,
      smartLabels: false,
      productAnatomyLegend: true,
      dataFlowLegend: true,
      bubbleSizeLegend: true,
      flowStatusLegend: true,
      dragHandles: true,
      pipelineLegend: true,
    },
    searchBarUi: {
      x: -481,
      y: 215,
      width: 298,
      height: 34,
      radius: 999,
      fontSize: 12.5,
      bg: "#fffef5",
      border: "#ede8ea",
      text: "#374151",
      placeholder: "#9ca3af",
      icon: "#9ca3af",
      shadow: 0.06,
    },
    toggleBars: {
      minWidth: 176,
      fontSize: 10,
      iconSize: 15,
      bg: "#fffef5",
      borderColor: "#e5e7eb",
      activeColor: "#1a1a1a",
      inactiveColor: "#6e6868",
      borderRadius: 9999,
      shadow: true,
    },
    selBubble: {
      bg: "#fffef5",
      borderColor: "#f0f0f0",
      borderWidth: 1,
      shadow: true,
      size: 100,
      defaultText: "MESHATLAS",
      defaultFontSize: 10,
      defaultColor: "#000000",
      defaultFontWeight: 700,
      defaultOpacity: 1,
      selLabelFontSize: 7,
      selLabelColor: "#000000",
      selLabelOpacity: 0.9,
      nameFontSize: 10,
      nameColor: "#000000",
      nameFontWeight: 700,
      subtitleFontSize: 8.5,
      subtitleColor: "#000000",
      subtitleOpacity: 1,
      textAlign: "center",
      dotSize: 4,
    },
    animationPaused: false,
    domainLabelPos: {
      Marketing: {
        x: -6.7,
        y: 5.6,
      },
      Product: {
        x: 2.3,
        y: 2.3,
      },
      HR: {
        x: 19,
        y: 23.5,
      },
      Support: {
        x: 31.4,
        y: 26.8,
      },
      Sales: {
        x: -6.7,
        y: 4.5,
      },
      Finance: {
        x: -20.1,
        y: 3.4,
      },
      "Supply Chain": {
        x: 15.6,
        y: 4.5,
      },
    },
    layerLabelPos: {
      APPS: {
        x: 43.6,
        y: 19,
      },
      SOURCE_ALIGNED: {
        x: 68.2,
        y: 17.9,
      },
      BUSINESS: {
        x: 78.3,
        y: 21.3,
      },
      CONSUMER_ALIGNED: {
        x: 87.2,
        y: 19.1,
      },
    },
    legendPos: {
      domain: {
        x: 362.3,
        y: -888.9,
      },
      appType: {
        x: 1166.9,
        y: -775.9,
      },
      dataFlow: {
        x: 60.1,
        y: -829.5,
      },
      productAnatomy: {
        x: 1007,
        y: -82.4,
      },
      bubbleSize: {
        x: 129.9,
        y: -832.7,
      },
      flowStatus: {
        x: -426.5,
        y: -808.4,
      },
      pipeline: {
        x: -31.3,
        y: -860,
      },
    },
    legendUi: {
      domainTitleSize: 6.5,
      domainTitleColor: "",
      domainTitleOpacity: 0.3,
      domainDividerOpacity: 0.12,
      domainNameSize: 5.5,
      domainNameColor: "",
      domainNameOpacity: 0.45,
      domainNameOpacityHover: 0.9,
      appTypeTitleSize: 6.5,
      appTypeTitleColor: "",
      appTypeTitleOpacity: 0.6,
      appTypeDividerOpacity: 0.2,
      appTypeRowSize: 7,
      appTypeRowColor: "",
      appTypeRowOpacity: 0.6,
      dataFlowTitleSize: 6.5,
      dataFlowTitleColor: "",
      dataFlowTitleOpacity: 0.6,
      dataFlowDividerOpacity: 0.2,
      dataFlowLineLabelSize: 7,
      dataFlowLineLabelColor: "",
      dataFlowLineLabelOpacity: 0.6,
      anatomyTitleSize: 6.5,
      anatomyTitleColor: "",
      anatomyTitleOpacity: 0.6,
      anatomyDividerOpacity: 0.2,
      anatomyRowTitleSize: 7,
      anatomyRowTitleColor: "",
      anatomyRowTitleOpacity: 0.6,
      bubbleTitleSize: 7,
      bubbleSubtitleSize: 5.7,
      bubbleTitleColor: "",
      bubbleSubtitleColor: "",
      bubbleTitleOpacity: 0.6,
      bubbleSubtitleOpacity: 0.65,
      bubbleSampleSmallR: 7,
      bubbleSampleLargeR: 13,
      dataFlowArrowOpacity: 0.7,
      dataFlowArrowStrokeWidth: 1.5,
    },
    arrowPos: {
      x: -20.2,
      y: 77.1,
    },
    legendScale: 1.5,
    appCategoryShapes: {
      SaaS: "circle",
      Database: "hexagon",
      API: "square",
      Streaming: "diamond",
      CRM: "circle",
      ERP: "circle",
      ANALYTICS: "circle",
      DEVTOOLS: "circle",
      STREAMING: "diamond",
      HRIS: "circle",
      DATABASE: "hexagon",
    },
    customTexts: [
      {
        id: "ct-1776247400598",
        text: "M E S H A T L A S",
        x: 0.5,
        y: -56,
        fontSize: 45,
        color: "#000000",
        fontWeight: 900,
        opacity: 1,
        width: 425,
        textAlign: "justify",
        lineHeight: 1.5,
      },
      {
        id: "ct-1776329886813",
        text: "Interactive Topology Of The Enterprise Data Ecosystem",
        x: 1.9,
        y: 5.7,
        fontSize: 18,
        color: "#000000",
        fontWeight: 900,
        opacity: 1,
        width: 540,
        lineHeight: 1.2,
        textAlign: "left",
      },
      {
        id: "ct-1776332923787",
        text: "MeshAtlas gives a live view of how enterprise data moves from source applications to business and consumer products across domains. It highlights lineage, quality, and pipeline health in one interactive map so teams can quickly identify impact, risk, and ownership. As the mesh evolves, this view stays current to support both engineering operations and executive decisions.",
        x: 2,
        y: 34.8,
        fontSize: 14,
        color: "#000000",
        fontWeight: 410,
        opacity: 0.75,
        width: 475,
        textAlign: "justify",
        lineHeight: 1.7,
      },
      {
        id: "ct-1777990211563",
        text: "Legend",
        x: 849.5,
        y: -40.3,
        fontSize: 13,
        color: "#000000",
        fontWeight: 507,
        opacity: 0.75,
        width: 60,
        lineHeight: 1.5,
        textAlign: "left",
      },
      {
        id: "ct-1778412122794",
        text: "Guide & Controls",
        x: 581.1,
        y: -39,
        fontSize: 13,
        color: "#000000",
        fontWeight: 507,
        opacity: 0.75,
        width: 105,
        lineHeight: 1.5,
        textAlign: "left",
      },
    ],
    typoOffset: {
      layerX: 4,
      layerY: 20,
      domainX: 2,
      domainY: -82,
      legendX: -170,
      legendY: 52,
    },
    separator: {
      color: "#000000",
      opacity: 0.5,
      width: 0.5,
      dash: 4,
    },
    arcBand: {
      opacity: 0.14,
      width: 10,
    },
    flow: {
      width: 0.7,
      opacity: 1,
      highlightWidth: 1.5,
      curveTension: 0.35,
      issueBoostOpacity: 1,
      issueBoostWidth: 1.2,
      idleStyle: "diamond",
      idleSpeed: 5,
      statusOverrides: {
        healthy: {
          color: "",
          width: 0.8,
          opacity: 0,
          animation: true,
          idleStyle: "diamond",
        },
        broken: {
          color: "",
          width: 1.9,
          opacity: 0,
          animation: true,
          idleStyle: "diamond",
        },
        warning: {
          color: "#eeb817",
          width: 0.5,
          opacity: 0,
          animation: true,
          idleStyle: "ripple",
        },
      },
      anchor: {
        upstream: {
          APPS: 1,
          SOURCE_ALIGNED: 1,
          BUSINESS: 1,
          CONSUMER_ALIGNED: 1,
        },
        downstream: {
          APPS: 0,
          SOURCE_ALIGNED: 0,
          BUSINESS: 0,
          CONSUMER_ALIGNED: 0,
        },
      },
      noodle: {
        appSourceCorridor: 0.55,
        appSourceSpread: 0.3,
        sourceBusinessCorridor: 0.44,
        sameLayerGapFactor: 0.49,
        sameLayerBase: 34,
        sameLayerScale: 41,
        sameLayerNearSpread: 0.23,
        sameLayerFarSpread: 0.33,
        businessBusinessLiftBase: 36,
        businessBusinessLiftScale: 62,
        businessBusinessLiftMax: 150,
        businessBusinessNearSpread: 0.24,
        businessBusinessFarSpread: 0.16,
        farSpanThreshold: 1.8,
        businessConsumerLiftBase: 51,
        businessConsumerLiftScale: 54,
        businessConsumerLiftMax: 134,
        businessConsumerNearSpread: 0.27,
        businessConsumerFarSpread: 0.29,
      },
    },
    arrowX: 20,
    arrowY: -85,
    arrowRotation: 0,
    arrowLength: 0.3,
    legendText: {
      appTitle: "APP CATEGORIES",
      domainTitle: "DOMAINS",
      dataFlowTitle: "DATA FLOW",
      dataFlowArrowLabel: "DATA FLOW",
      productLayersTitle: "PRODUCT LAYERS",
      bubbleSizeTitle: "PRODUCT SIZE",
      bubbleSizeSubtitle: "",
      anatomyRows: {},
      pipelineHealthy: "Healthy",
      pipelineBroken: "Broken",
      pipelineWarning: "Warning / upstream stale",
      appTypeLabels: {
        SaaS: "SaaS",
        Database: "Database",
        API: "API",
        Streaming: "Streaming",
        DATABASE: "Database",
      },
    },
    customSeparators: [
      {
        id: "sep-1777992360154",
        x1: 831,
        y1: 150,
        x2: 832,
        y2: 0,
        color: "#787878",
        width: 0.9,
        opacity: 0.4,
        dash: 2,
      },
      {
        id: "sep-1778412529473",
        x1: 574.5,
        y1: 150,
        x2: 574.4,
        y2: -7.1,
        color: "#787878",
        width: 0.9,
        opacity: 0.4,
        dash: 2,
      },
    ],
    panelBg: "#fce8b2",
    panelGradient: {
      enabled: true,
      type: "linear",
      color1: "#e9e6db",
      color2: "#f4edba",
      color3: "#fce8b2",
      midStop: 35,
      angle: 60,
      opacity: 60,
    },
    paneBorder: {
      color: "#cfcfcf",
      width: 1,
      radius: 11,
      padTop: 16,
      padBottom: 16,
      padSide: 13,
    },
    sortMode: "custom",
    arrowColor: "#c11a1a",
    panelSync: {
      sourcePanel: "cost",
      includeWidgetShell: false,
    },
    tabDock: {
      bg: "#fffad6",
      activeColor: "#000000",
      inactiveColor: "#ffffff",
      textActive: "#000000",
      textInactive: "#707070",
      iconSize: 16,
      circleSize: 36,
      gap: 16,
    },
    costPanel: {
      widgetBg: "#fef9e6",
      widgetBorder: "#ffffff",
      widgetRadius: 20,
      sectionGap: 20,
      titleSize: 17.5,
      banSize: 21,
      labelSize: 9.5,
      tabSize: 9.5,
      barHeight: 6.5,
      chartHeight: 120,
      chartPadLeft: 30,
      chartPadBottom: 18,
      chartPadTop: 6,
      chartPadRight: 6,
      lineWidth: 2,
      dotRadius: 2.5,
      dotFill: "#ffffff",
      dotStrokeWidth: 1.2,
      mutedColor: "#000000",
      posColor: "#22c55e",
      negColor: "#ef4444",
      chartLineColor: "",
      chartAreaColor: "#555855",
      chartAreaOpacity: 0.25,
      chartGridColor: "#e5e7eb",
      chartGridWidth: 0.5,
      chartAxisFontSize: 8,
      chartAxisColor: "#78716c",
      chartMonthFontSize: 8,
      chartMonthColor: "#78716c",
      chartDotStrokeColor: "",
      tableFontSize: 9,
      tableMaxHeight: 210,
      tableHeaderBg: "#fffff0",
      tableHeaderColor: "#6e6a68",
      catIngestionColor: "#262626",
      catProcessingColor: "#262626",
      catOrchestrationColor: "#262626",
      catStorageColor: "#262626",
      selTitleSize: 15,
      selBanSize: 21,
      selLabelSize: 10.5,
      selMutedColor: "#000000",
      selBarHeight: 7,
      selCatLabelSize: 10,
      selTrendTabSize: 10,
      selAppNameSize: 10,
      selAppCostSize: 9,
      selChartGridColor: "#e5e7eb",
      selChartAxisColor: "#78716c",
      selChartMonthColor: "#78716c",
      selChartLineColor: "#000000",
      selChartAreaOpacity: 0.19,
      selChartLineWidth: 2,
      selChartDotRadius: 2.5,
      selChartAxisFontSize: 8,
      selChartMonthFontSize: 8.5,
      selChartWidth: 335,
      selChartHeight: 160,
      selChartPadLeft: 30,
      selChartPadRight: 14,
      selChartPadTop: 11,
      selChartPadBottom: 20,
      selChartGridLineWidth: 0.5,
      selChartDotStrokeWidth: 1.2,
      selChartDotFill: "#ffffff",
      selTitleColor: "",
      selMutedOverride: "",
      nsPageTitleColor: "",
      nsCaptionSize: 8.5,
      nsVsLabelSize: 8,
      nsDeltaSize: 9.5,
      nsTrendTotalSize: 18,
      nsTrendYearSize: 9,
      nsTableDomainSize: 7.5,
      nsSortBtnSize: 7.5,
      selWidgetBg: "#ffffff",
      selWidgetBorder: "#e7e5e4",
      selSectionGap: 22,
    },
    overviewPanel: {
      typeBubbleSize: 80,
      typeAppDotR: 3.5,
      domainBubbleSize: 80,
      domainAppDotR: 4,
      productDotR: 4,
      dotActiveOpacity: 0.9,
      dotSpacing: 3.6,
      cardBg: "#fef9e6",
      cardBorder: "#ffffff",
      cardRadius: 22,
      cardShadow: true,
      sectionGap: 40,
      titleSize: 12.5,
      banSize: 21,
      labelSize: 9,
      gaugeSize: 50,
      barHeight: 2,
      tabBg: "#000000",
      tabTextColor: "#ffffff",
      tabInactiveColor: "#000000",
      tabFontSize: 10,
      domainOutlineWidth: 0.75,
      domainFillOpacity: 0.03,
      domainCircleGap: 16,
      domainLabelColor: "#000000",
      domainLabelSize: 8.5,
      countSize: 14,
      kpiIconBgOpacity: 0.12,
      kpiNumberColor: "#000000",
      kpiLabelColor: "#000000",
      selBannerNameSize: 18,
      selBannerDescSize: 12,
      selBannerLabelSize: 11,
      selKpiValueSize: 21,
      selKpiLabelSize: 9.5,
      selSectionHeaderSize: 10.5,
      selItemNameSize: 10.5,
      selItemDotSize: 6.5,
      selLayerLabelSize: 9,
      selCardRadius: 20,
      selCardBg: "#ffffff",
      selCardBorder: "#e7e5e4",
      selSectionGap: 24,
      selStarSize: 14,
      selDomainSize: 11.5,
      selBannerOverlineColor: "#ffffff",
      selBannerTitleColor: "#ffffff",
      selBannerDescColor: "#ffffff",
      selBannerPillTextColor: "#ffffff",
      selBannerDomainTextColor: "#ffffff",
      selKpiQualityValueColor: "",
      selKpiQualityLabelColor: "",
      selKpiRatingValueColor: "",
      selKpiRatingLabelColor: "",
      selKpiSlaValueColor: "",
      selKpiSlaLabelColor: "",
      selLineageSectionTitleColor: "#000000",
      selLineageItemTextColor: "",
      selClearLinkColor: "#9ca3af",
      nsPageTitleSize: 17.5,
      nsPageSubtitleSize: 11.5,
      nsPageTitleColor: "#000000",
      nsPageSubtitleColor: "#000000",
      nsEntitiesTitleSize: 13,
      nsEntitiesSubtitleSize: 10,
      nsEntitiesTitleColor: "",
      nsEntitiesSubtitleColor: "",
      nsKpiIconBox: 36,
      nsKpiIconSvg: 18,
      kpiDotSize: 8,
      kpiDotGap: 3,
      activeTint: "#ffffff",
      brokenTint: "#ffffff",
    },
    cataloguePanel: {
      widgetBg: "#ffffff",
      widgetBorder: "#ffffff",
      widgetRadius: 24,
      sectionGap: 16,
      titleSize: 17.5,
      subtitleSize: 11.5,
      headerTextColor: "#000000",
      headerSubColor: "#171717",
      tabHeight: 48,
      tabRadius: 13,
      tabActiveTextColor: "#ffffff",
      tabInactiveTextColor: "#77726e",
      tabFontSize: 12,
      gridCols: 2,
      gridGap: 16,
      listMaxHeight: 560,
      cardBg: "#fef9e6",
      cardBorder: "#ffffff",
      cardRadius: 14,
      cardShadow: true,
      cardHoverBg: "#ffffff",
      bannerHeight: 7,
      cardNameSize: 10.5,
      cardNameColor: "#1a1a1a",
      cardDescSize: 10,
      descColor: "#000000",
      cardMetaSize: 9.5,
      metaColor: "#282624",
      tagBg: "#000000",
      tagColor: "#78716c",
      tagFontSize: 8.5,
      tagRadius: 5,
      tabCountSize: 9,
      showBanner: false,
      searchBg: "#ffffff",
      searchBorder: "#e7e5e4",
      searchTextColor: "#1a1a1a",
      searchPlaceholderColor: "#a8a29e",
      searchFontSize: 9.5,
      searchRadius: 8,
      searchHeight: 28,
      starSize: 13,
      domainDotSize: 7,
      separatorColor: "#d3caca",
      infoIconSize: 24,
      infoIconBg: "#f5f5eb",
      infoIconActiveBg: "#000000",
      infoIconColor: "#000000",
      infoIconActiveColor: "#ffffff",
      rubricWidth: 300,
      rubricTitleSize: 9.5,
      rubricStarSize: 8.5,
      rubricLabelSize: 8.5,
      rubricDescSize: 8.5,
      selBannerNameSize: 18,
      selBannerDescSize: 12,
      selBannerLabelSize: 11,
      selStarSize: 14.5,
      selDetailLabelSize: 9.5,
      selDetailValueSize: 10.5,
      selDetailIconSize: 11.5,
      selScorecardLabelSize: 9.5,
      selScorecardValueSize: 10.5,
      selScorecardBarHeight: 5.5,
      selBannerTitleColor: "#ffffff",
      selBannerDescColor: "#ffffff",
      selBannerLabelColor: "#ffffff",
      selBannerIconStroke: "#ffffff",
      selDetailLabelColor: "#000000",
      selDetailValueColor: "#000000",
      selDetailSectionTitleColor: "#000000",
      selDetailIconStroke: "#000000",
      selScorecardTitleColor: "#000000",
      selScorecardIconStroke: "#000000",
      selScorecardAvgColor: "",
      selSectionGap: 22,
      selHeroRadius: 10,
      selHeroPadding: 14,
      selHeroDecorOpacity: 20,
      selCardRadius: 12,
      selCardShadow: true,
      selCardBodyPadding: 12,
      selCardHeaderPadX: 12,
      selCardHeaderPadY: 8,
      selTintCardBorder: 9.5,
      selTintHeaderBg: 3,
      selTintHeaderRule: 7,
      selTintRowRule: 12,
      selTintIconBg: 4.7,
      selScorecardBodyPadding: 10,
      selScorecardGridGap: 8,
      selWidgetBg: "#ffffff",
      selWidgetBorder: "#e7e5e4",
      nsTabIconWrap: 22,
      nsTabIconSvg: 14.5,
      cardPadding: 16,
      rubricBg: "#f4eeeb",
      rubricBorder: "#f4eeeb",
    },
    qualityPanel: {
      widgetBg: "#fef9e6",
      widgetBorder: "#ffffff",
      widgetRadius: 22,
      sectionGap: 16,
      titleSize: 17,
      subtitleSize: 10.5,
      headerTextColor: "#000000",
      headerSubColor: "#000000",
      radarSize: 270,
      radarFillOpacity: 0.1,
      radarStrokeWidth: 1,
      radarGridColor: "#c2c2c2",
      radarLabelSize: 10,
      radarValueSize: 10.5,
      radarDotRadius: 3.5,
      radarCenterScoreSize: 15,
      radarCenterLabelSize: 9,
      radarLabelColor: "#0d0d0d",
      radarAxisWidth: 0.4,
      radarLabelGap: 10,
      radarLabelOffset: 25,
      radarConsistencyLabelOutset: 10,
      starMeaningSize: 9,
      qualityHighColor: "#50b620",
      qualityMidColor: "#c8ab41",
      qualityLowColor: "#e65185",
      dimBarHeight: 5,
      dimLabelSize: 10,
      dimValueSize: 11,
      dimDescSize: 10.5,
      dimIconColor: "#6ac440",
      inspectTextSize: 9,
      starSize: 16,
      starScoreSize: 12.5,
      layerPillSize: 10.5,
      cardBg: "#ffffff",
      cardBorder: "#f5f5f4",
      cardRadius: 14,
      methodTextSize: 10,
      methodTextColor: "#1a1a1a",
      iconSize: 17,
      promptTextSize: 10,
      insightsMaxHeight: 270,
      insightsBg: "#ffffff",
      insightsBorder: "#e7e5e4",
      insightsPassingBg: "#000000",
      insightsAttentionBg: "#06",
      selHeaderTitleColor: "",
      selHeaderSubtitleColor: "",
      selProductBarTextColor: "",
      selInsightsTitleColor: "",
      selInsightsHintColor: "",
      selInsightsPassingHeaderColor: "",
      selInsightsAttentionHeaderColor: "",
      selInsightsStrongDimLabelColor: "",
      selClearLinkColor: "#9ca3af",
      selWidgetBg: "#ffffff",
      selWidgetBorder: "#e7e5e4",
      selRadarHeaderSize: 10.5,
      selSectionGap: 12,
      drillTitleSize: 13,
      drillDescSize: 10,
      drillCloseSize: 10,
      drillKpiValueSize: 18,
      drillKpiLabelSize: 8,
      drillSectionHeaderSize: 10,
      drillFailureNameSize: 10,
      drillFailureIssueSize: 9,
      drillEmptyStateSize: 10,
      nsEmptyHeadingSize: 0,
      nsEmptyHeadingColor: "",
      nsEmptyBodySize: 0,
      nsEmptyRadarLegendSize: 0,
      nsEmptySearchSize: 0,
      maxHeight: 0,
    },
    pipelinePanel: {
      widgetBg: "#fef9e6",
      widgetBorder: "#f4f0f0",
      widgetRadius: 18,
      sectionGap: 16,
      titleSize: 17,
      subtitleSize: 11.5,
      headerTextColor: "#1a1a1a",
      headerSubColor: "#272626",
      tabHeight: 40,
      tabRadius: 10,
      tabFontSize: 9.5,
      tabActiveTextColor: "#1a1a1a",
      tabInactiveTextColor: "#a8a29e",
      tabIconSize: 22,
      tabCountSize: 8,
      cardBg: "#fafaf9",
      cardBorder: "#f5f5f4",
      cardRadius: 10,
      kpiFontSize: 21,
      kpiLabelSize: 8,
      prodNameSize: 10,
      prodMetaSize: 9.5,
      statusDotSize: 6.5,
      statusBadgeSize: 6.5,
      modelNameSize: 9,
      tableHeaderSize: 8,
      tableDataSize: 9,
      sectionHeaderSize: 9,
      logSeveritySize: 8,
      logMessageSize: 10,
      logTimeSize: 7,
      logBadgeSize: 8,
      logIconSize: 20,
      logSevBadgeSize: 6,
      archLabelSize: 11.5,
      archSubSize: 9,
      archMaxInputs: 2,
      banDescSize: 10,
      searchBg: "#fafaf9",
      searchBorder: "#e7e5e4",
      searchFontSize: 9,
      selWidgetBg: "#ffffff",
      selWidgetBorder: "#e7e5e4",
      selBoxBg: "#ffffff",
      selBoxBorder: "#e7e5e4",
      selTableBg: "#ffffff",
      selTableHeaderBg: "#f5f5f4",
      selTableBorder: "#e7e5e4",
      selModelTableMaxHeight: 230,
      selLogMaxHeight: 230,
      selSectionGap: 20,
      selLineageTitleSize: 9,
      selLineageTitleColor: "#000000",
      selLineageChevronColor: "#525252",
      nsBanTabFontSize: 0,
      flowNodeSize: 18,
      flowArrowColor: "#d6d3d1",
    },
  };
