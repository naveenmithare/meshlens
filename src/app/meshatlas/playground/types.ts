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
  };
  show: { productLabels: boolean; layerLabels: boolean; domainNames: boolean; domainLegend: boolean; appTypeLegend: boolean; dataFlowArrow: boolean; separators: boolean; arcBands: boolean; flowAnimation: boolean; searchBar: boolean; smartLabels: boolean; productAnatomyLegend: boolean; dataFlowLegend: boolean; bubbleSizeLegend: boolean; flowStatusLegend: boolean };
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
  animationPaused: boolean;
  domainLabelPos: Record<string, { x: number; y: number }>;
  legendPos: { domain: { x: number; y: number }; appType: { x: number; y: number }; dataFlow: { x: number; y: number }; productAnatomy: { x: number; y: number }; bubbleSize: { x: number; y: number }; flowStatus: { x: number; y: number } };
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
  };
}

export const APP_CATEGORIES = ["SaaS", "Database", "API", "Streaming"] as const;

export const DEFAULTS: PlaygroundConfig = {
  layout: "arc",
  layerColors: { APPS: "#0f2e33", SOURCE_ALIGNED: "#3d9b8f", BUSINESS: "#c5a800", CONSUMER_ALIGNED: "#d96028" },
  appTypeColors: { SaaS: "#f5a882", Database: "#5bbead", API: "#5b9bd5", Streaming: "#8fcd73" },
  green: "#8fcd73",
  red: "#ef4444",
  warning: "#f59e0b",
  text: "#1a1a1a",
  bg: "#ffffff",
  stageScaleFactor: 1,
  radii: { APPS: 140, SOURCE_ALIGNED: 275, BUSINESS: 400, CONSUMER_ALIGNED: 520 },
  bubbleR: { SOURCE_ALIGNED: 12, BUSINESS: 9, CONSUMER_ALIGNED: 12 },
  appDotR: 3,
  cx: 600,
  cy: 780,
  pad: 0.12,
  vw: 1200,
  vh: 800,
  bizBubbleScale: 1,
  conBubbleScale: 1,
  innerDotR: 3.5,
  bubbleGap: 4,
  equalSpread: false,
  bubbleSizeMode: "uniform",
  uniformSrcR: 14,
  uniformBizR: 18,
  uniformConR: 20,
  domainColors: {},
  domainBubbleOpacity: 0.10,
  groupBubbleOpacity: 0.20,
  outerBubbleOpacity: { SOURCE_ALIGNED: 0.15, BUSINESS: 0.15, CONSUMER_ALIGNED: 0.15 },
  labelSize: 8,
  domainNameSize: 8.5,
  legendSize: 9,
  labelOpacity: 0.5,
  labelWeight: 700,
  prodLabel: {
    srcSize: 5, bizSize: 6, conSize: 7, offset: 4, staggerGap: 16, opacity: 0.55, rotation: 0,
    srcOffset: 10, bizOffset: 12, conOffset: 14,
    srcAngle: 0, bizAngle: 0, conAngle: 0,
    xOffset: 0, yOffset: 0,
    perProduct: {},
  },
  show: { productLabels: true, layerLabels: true, domainNames: true, domainLegend: true, appTypeLegend: true, dataFlowArrow: true, separators: true, arcBands: true, flowAnimation: true, searchBar: true, smartLabels: true, productAnatomyLegend: true, dataFlowLegend: true, bubbleSizeLegend: true, flowStatusLegend: true },
  searchBarUi: {
    x: 0,
    y: 0,
    width: 360,
    height: 40,
    radius: 999,
    fontSize: 13,
    bg: "#ffffff",
    border: "#e5e7eb",
    text: "#374151",
    placeholder: "#9ca3af",
    icon: "#9ca3af",
    shadow: 0.14,
  },
  toggleBars: {
    minWidth: 200,
    fontSize: 10,
    iconSize: 14,
    bg: "rgba(255,255,255,0.95)",
    borderColor: "#e5e7eb",
    activeColor: "#1a1a1a",
    inactiveColor: "#999999",
    borderRadius: 9999,
    shadow: true,
  },
  animationPaused: false,
  domainLabelPos: {},
  layerLabelPos: {},
  legendPos: { domain: { x: 0, y: 0 }, appType: { x: 0, y: 0 }, dataFlow: { x: 0, y: 0 }, productAnatomy: { x: 0, y: 0 }, bubbleSize: { x: 0, y: 0 }, flowStatus: { x: 0, y: 0 } },
  legendUi: {
    domainTitleSize: 6.5, domainTitleColor: "", domainTitleOpacity: 0.3, domainDividerOpacity: 0.12,
    domainNameSize: 5.5, domainNameColor: "", domainNameOpacity: 0.45, domainNameOpacityHover: 0.9,
    appTypeTitleSize: 6.5, appTypeTitleColor: "", appTypeTitleOpacity: 0.3, appTypeDividerOpacity: 0.12, appTypeRowSize: 7, appTypeRowColor: "", appTypeRowOpacity: 0.5,
    dataFlowTitleSize: 6.5, dataFlowTitleColor: "", dataFlowTitleOpacity: 0.3, dataFlowDividerOpacity: 0.12, dataFlowLineLabelSize: 6.5, dataFlowLineLabelColor: "", dataFlowLineLabelOpacity: 0.45,
    anatomyTitleSize: 6.5, anatomyTitleColor: "", anatomyTitleOpacity: 0.3, anatomyDividerOpacity: 0.12, anatomyRowTitleSize: 6.5, anatomyRowTitleColor: "", anatomyRowTitleOpacity: 0.5,
    bubbleTitleSize: 6.5, bubbleSubtitleSize: 5.25, bubbleTitleColor: "", bubbleSubtitleColor: "", bubbleTitleOpacity: 0.35, bubbleSubtitleOpacity: 0.32, bubbleSampleSmallR: 5, bubbleSampleLargeR: 11,
    dataFlowArrowOpacity: 1, dataFlowArrowStrokeWidth: 1.5,
  },
  arrowPos: { x: 0, y: 0 },
  legendScale: 1,
  appCategoryShapes: { SaaS: "circle" as const, Database: "hexagon" as const, API: "square" as const, Streaming: "diamond" as const },
  customTexts: [],
  typoOffset: { layerX: 0, layerY: 0, domainX: 0, domainY: 0, legendX: 0, legendY: 0 },
  separator: { color: "#1a1a1a", opacity: 0.08, width: 0.5, dash: 4 },
  arcBand: { opacity: 0.08, width: 30 },
  flow: {
    width: 0.8, opacity: 0.08, highlightWidth: 2.5, curveTension: 0.5,
    issueBoostOpacity: 0.9, issueBoostWidth: 2,
    idleStyle: "glow" as const, idleSpeed: 4,
    statusOverrides: {
      healthy: { color: "", width: 0, opacity: 0, animation: true, idleStyle: "" },
      broken: { color: "", width: 0, opacity: 0, animation: true, idleStyle: "" },
      warning: { color: "", width: 0, opacity: 0, animation: true, idleStyle: "" },
    },
    anchor: {
      upstream: { APPS: 1, SOURCE_ALIGNED: 1, BUSINESS: 1, CONSUMER_ALIGNED: 1 },
      downstream: { APPS: 1, SOURCE_ALIGNED: 0, BUSINESS: 0, CONSUMER_ALIGNED: 0 },
    },
    noodle: {
      appSourceCorridor: 0.55,
      appSourceSpread: 0.33,
      sourceBusinessCorridor: 0.58,
      sameLayerGapFactor: 0.8,
      sameLayerBase: 14,
      sameLayerScale: 28,
      sameLayerNearSpread: 0.28,
      sameLayerFarSpread: 0.18,
      businessBusinessLiftBase: 36,
      businessBusinessLiftScale: 62,
      businessBusinessLiftMax: 150,
      businessBusinessNearSpread: 0.24,
      businessBusinessFarSpread: 0.16,
      farSpanThreshold: 1.2,
      businessConsumerLiftBase: 28,
      businessConsumerLiftScale: 52,
      businessConsumerLiftMax: 115,
      businessConsumerNearSpread: 0.22,
      businessConsumerFarSpread: 0.16,
    },
  },
  arrowX: 42,
  arrowY: 0,
  arrowRotation: 0,
  arrowLength: 1,
  legendText: {
    appTitle: "APP CATEGORIES",
    domainTitle: "DOMAINS",
    dataFlowTitle: "DATA FLOW",
    dataFlowArrowLabel: "DATA FLOW",
    productLayersTitle: "PRODUCT LAYERS",
    bubbleSizeTitle: "BUBBLE SIZE",
    bubbleSizeSubtitle: "",
    anatomyRows: {},
    pipelineHealthy: "Healthy lineage",
    pipelineBroken: "Broken / degraded",
    pipelineWarning: "Warning / upstream stale",
    appTypeLabels: { SaaS: "SaaS", Database: "Database", API: "API", Streaming: "Streaming" },
  },
  customSeparators: [],
  panelBg: "#ffffff",
  panelGradient: { enabled: false, type: "linear" as const, color1: "#ffffff", color2: "#faf5ef", color3: "#f5f0eb", midStop: 50, angle: 180, opacity: 100 },
  paneBorder: { color: "#d1d5db", width: 1.5, radius: 12, padTop: 6, padBottom: 14, padSide: 6 },
  sortMode: "custom",
  arrowColor: "#000000",
  panelSync: { sourcePanel: "catalogue", includeWidgetShell: false },
  tabDock: { bg: "#f5f5f0", activeColor: "#1a1a1a", inactiveColor: "#ffffff", textActive: "#1a1a1a", textInactive: "#9ca3af", iconSize: 16, circleSize: 40, gap: 6 },
  costPanel: {
    widgetBg: "#fafaf9",
    widgetBorder: "#e7e5e4",
    widgetRadius: 14,
    sectionGap: 14,
    titleSize: 15,
    banSize: 22,
    labelSize: 9,
    tabSize: 7.5,
    barHeight: 5,
    chartHeight: 120,
    chartPadLeft: 46,
    chartPadBottom: 22,
    chartPadTop: 8,
    chartPadRight: 8,
    lineWidth: 2,
    dotRadius: 2.5,
    dotFill: "#ffffff",
    dotStrokeWidth: 1.2,
    mutedColor: "#a8a29e",
    posColor: "#22c55e",
    negColor: "#ef4444",
    chartLineColor: "",
    chartAreaColor: "",
    chartAreaOpacity: 0.15,
    chartGridColor: "#e5e7eb",
    chartGridWidth: 0.5,
    chartAxisFontSize: 7.5,
    chartAxisColor: "#78716c",
    chartMonthFontSize: 7.5,
    chartMonthColor: "#78716c",
    chartDotStrokeColor: "",
    tableFontSize: 7.5,
    tableMaxHeight: 160,
    tableHeaderBg: "#f5f5f4",
    tableHeaderColor: "#a8a29e",
    catIngestionColor: "#d97706",
    catProcessingColor: "#22c55e",
    catOrchestrationColor: "#ef4444",
    catStorageColor: "#6b7280",
    selTitleSize: 15,
    selBanSize: 22,
    selLabelSize: 9,
    selMutedColor: "#a8a29e",
    selBarHeight: 5,
    selCatLabelSize: 9,
    selTrendTabSize: 7,
    selAppNameSize: 10,
    selAppCostSize: 9,
    selChartGridColor: "#e5e7eb",
    selChartAxisColor: "#78716c",
    selChartMonthColor: "#78716c",
    selChartLineColor: "",
    selChartAreaOpacity: 0.18,
    selChartLineWidth: 2,
    selChartDotRadius: 2.5,
    selChartAxisFontSize: 6,
    selChartMonthFontSize: 6.5,
    selChartWidth: 360,
    selChartHeight: 100,
    selChartPadLeft: 36,
    selChartPadRight: 0,
    selChartPadTop: 0,
    selChartPadBottom: 18,
    selChartGridLineWidth: 0.5,
    selChartDotStrokeWidth: 1.2,
    selChartDotFill: "#ffffff",
    selTitleColor: "",
    selMutedOverride: "",
    nsPageTitleColor: "",
    nsCaptionSize: 7,
    nsVsLabelSize: 7,
    nsDeltaSize: 8,
    nsTrendTotalSize: 17,
    nsTrendYearSize: 9,
    nsTableDomainSize: 6,
    nsSortBtnSize: 7,
    selWidgetBg: "#ffffff",
    selWidgetBorder: "#e7e5e4",
    selSectionGap: 14,
  },
  overviewPanel: {
    typeBubbleSize: 80,
    typeAppDotR: 4.5,
    domainBubbleSize: 58,
    domainAppDotR: 3.5,
    productDotR: 4,
    dotActiveOpacity: 0.6,
    dotSpacing: 2.4,
    cardBg: "#fafaf9",
    cardBorder: "#e7e5e4",
    cardRadius: 14,
    cardShadow: true,
    sectionGap: 18,
    titleSize: 10,
    banSize: 24,
    labelSize: 7,
    gaugeSize: 88,
    barHeight: 5,
    tabBg: "#1a1a1a",
    tabTextColor: "#ffffff",
    tabInactiveColor: "#a8a29e",
    tabFontSize: 8,
    domainOutlineWidth: 1,
    domainFillOpacity: 0.04,
    domainCircleGap: 10,
    domainLabelColor: "#a8a29e",
    domainLabelSize: 6.5,
    countSize: 13,
    kpiIconBgOpacity: 0.12,
    kpiNumberColor: "#1a1a1a",
    kpiLabelColor: "#a8a29e",
    selBannerNameSize: 14,
    selBannerDescSize: 9,
    selBannerLabelSize: 7,
    selKpiValueSize: 16,
    selKpiLabelSize: 7,
    selSectionHeaderSize: 9,
    selItemNameSize: 9.5,
    selItemDotSize: 6,
    selLayerLabelSize: 7.5,
    selCardRadius: 12,
    selCardBg: "#ffffff",
    selCardBorder: "#e7e5e4",
    selSectionGap: 10,
    selStarSize: 11,
    selDomainSize: 9,
    selBannerOverlineColor: "rgba(255,255,255,0.5)",
    selBannerTitleColor: "#ffffff",
    selBannerDescColor: "rgba(255,255,255,0.65)",
    selBannerPillTextColor: "#ffffff",
    selBannerDomainTextColor: "rgba(255,255,255,0.85)",
    selKpiQualityValueColor: "",
    selKpiQualityLabelColor: "",
    selKpiRatingValueColor: "",
    selKpiRatingLabelColor: "",
    selKpiSlaValueColor: "",
    selKpiSlaLabelColor: "",
    selLineageSectionTitleColor: "",
    selLineageItemTextColor: "",
    selClearLinkColor: "#9ca3af",
    nsPageTitleSize: 17,
    nsPageSubtitleSize: 11,
    nsPageTitleColor: "",
    nsPageSubtitleColor: "",
    nsEntitiesTitleSize: 13,
    nsEntitiesSubtitleSize: 10,
    nsEntitiesTitleColor: "",
    nsEntitiesSubtitleColor: "",
    nsKpiIconBox: 36,
    nsKpiIconSvg: 18,
  },
  cataloguePanel: {
    widgetBg: "#fafaf9",
    widgetBorder: "#e7e5e4",
    widgetRadius: 12,
    sectionGap: 10,
    titleSize: 15,
    subtitleSize: 10,
    headerTextColor: "#1a1a1a",
    headerSubColor: "#a8a29e",
    tabHeight: 34,
    tabRadius: 8,
    tabActiveTextColor: "#ffffff",
    tabInactiveTextColor: "#78716c",
    tabFontSize: 8.5,
    gridCols: 2,
    gridGap: 8,
    listMaxHeight: 400,
    cardBg: "#ffffff",
    cardBorder: "#e7e5e4",
    cardRadius: 10,
    cardShadow: false,
    cardHoverBg: "#f5f5f4",
    bannerHeight: 6,
    cardNameSize: 9.5,
    cardNameColor: "#1a1a1a",
    cardDescSize: 7.5,
    descColor: "#78716c",
    cardMetaSize: 7,
    metaColor: "#a8a29e",
    tagBg: "#f5f5f4",
    tagColor: "#78716c",
    tagFontSize: 6.5,
    tabCountSize: 8,
    showBanner: true,
    searchBg: "#ffffff",
    searchBorder: "#e7e5e4",
    searchTextColor: "#1a1a1a",
    searchPlaceholderColor: "#a8a29e",
    searchFontSize: 9,
    searchRadius: 8,
    searchHeight: 28,
    tagRadius: 4,
    starSize: 8,
    domainDotSize: 5,
    separatorColor: "#e7e5e4",
    infoIconSize: 22,
    infoIconBg: "#e7e5e4",
    infoIconActiveBg: "#1a1a1a",
    infoIconColor: "#78716c",
    infoIconActiveColor: "#ffffff",
    rubricWidth: 220,
    rubricTitleSize: 8,
    rubricStarSize: 7,
    rubricLabelSize: 8,
    rubricDescSize: 7.5,
    selBannerNameSize: 15,
    selBannerDescSize: 9,
    selBannerLabelSize: 8,
    selStarSize: 12,
    selDetailLabelSize: 8,
    selDetailValueSize: 9.5,
    selDetailIconSize: 10,
    selScorecardLabelSize: 8,
    selScorecardValueSize: 8,
    selScorecardBarHeight: 4,
    selBannerTitleColor: "#ffffff",
    selBannerDescColor: "rgba(255,255,255,0.7)",
    selBannerLabelColor: "rgba(255,255,255,0.6)",
    selBannerIconStroke: "rgba(255,255,255,0.95)",
    selDetailLabelColor: "",
    selDetailValueColor: "",
    selDetailSectionTitleColor: "",
    selDetailIconStroke: "#000000",
    selScorecardTitleColor: "",
    selScorecardIconStroke: "#000000",
    selScorecardAvgColor: "",
    selSectionGap: 10,
    selHeroRadius: 12,
    selHeroPadding: 16,
    selHeroDecorOpacity: 20,
    selCardRadius: 12,
    selCardShadow: false,
    selCardBodyPadding: 12,
    selCardHeaderPadX: 12,
    selCardHeaderPadY: 8,
    selTintCardBorder: 9.5,
    selTintHeaderBg: 3,
    selTintHeaderRule: 7,
    selTintRowRule: 3,
    selTintIconBg: 4.7,
    selScorecardBodyPadding: 10,
    selScorecardGridGap: 6,
    selWidgetBg: "#ffffff",
    selWidgetBorder: "#e7e5e4",
    nsTabIconWrap: 22,
    nsTabIconSvg: 12,
  },
  qualityPanel: {
    widgetBg: "#ffffff",
    widgetBorder: "#e7e5e4",
    widgetRadius: 12,
    sectionGap: 12,
    titleSize: 15,
    subtitleSize: 10,
    headerTextColor: "#1a1a1a",
    headerSubColor: "#78716c",
    radarSize: 210,
    radarFillOpacity: 0.18,
    radarStrokeWidth: 1.5,
    radarGridColor: "#e5e7eb",
    radarLabelSize: 6.5,
    radarValueSize: 7,
    radarDotRadius: 3,
    radarCenterScoreSize: 16,
    radarCenterLabelSize: 8,
    radarLabelColor: "#6b7280",
    radarAxisWidth: 0.5,
    radarLabelGap: 9,
    radarLabelOffset: 22,
    radarConsistencyLabelOutset: 8,
    starMeaningSize: 8,
    qualityHighColor: "#8fcd73",
    qualityMidColor: "#dab508",
    qualityLowColor: "#ef4444",
    dimBarHeight: 6,
    dimLabelSize: 10,
    dimValueSize: 11,
    dimDescSize: 9,
    dimIconColor: "#8fcd73",
    inspectTextSize: 7,
    starSize: 13,
    starScoreSize: 11,
    layerPillSize: 8,
    cardBg: "#fafaf9",
    cardBorder: "#f5f5f4",
    cardRadius: 12,
    methodTextSize: 9,
    methodTextColor: "#78716c",
    iconSize: 14,
    promptTextSize: 10,
    insightsMaxHeight: 280,
    insightsBg: "#ffffff",
    insightsBorder: "#e7e5e4",
    insightsPassingBg: "#8fcd7308",
    insightsAttentionBg: "#ef444408",
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
    selRadarHeaderSize: 11,
    selSectionGap: 8,
    drillTitleSize: 13,
    drillDescSize: 10,
    drillCloseSize: 10,
    drillKpiValueSize: 16,
    drillKpiLabelSize: 7,
    drillSectionHeaderSize: 10,
    drillFailureNameSize: 10,
    drillFailureIssueSize: 9,
    drillEmptyStateSize: 10,
    nsEmptyHeadingSize: 0,
    nsEmptyHeadingColor: "",
    nsEmptyBodySize: 0,
    nsEmptyRadarLegendSize: 0,
    nsEmptySearchSize: 0,
  },
  pipelinePanel: {
    widgetBg: "#ffffff",
    widgetBorder: "#e7e5e4",
    widgetRadius: 12,
    sectionGap: 12,
    titleSize: 15,
    subtitleSize: 10,
    headerTextColor: "#1a1a1a",
    headerSubColor: "#78716c",
    tabHeight: 38,
    tabRadius: 10,
    tabFontSize: 7,
    tabActiveTextColor: "#1a1a1a",
    tabInactiveTextColor: "#a8a29e",
    tabIconSize: 22,
    tabCountSize: 8,
    cardBg: "#fafaf9",
    cardBorder: "#f5f5f4",
    cardRadius: 10,
    kpiFontSize: 16,
    kpiLabelSize: 6,
    prodNameSize: 9,
    prodMetaSize: 6,
    statusDotSize: 5,
    statusBadgeSize: 5.5,
    modelNameSize: 7.5,
    tableHeaderSize: 6,
    tableDataSize: 7,
    sectionHeaderSize: 8,
    logSeveritySize: 7,
    logMessageSize: 9,
    logTimeSize: 7,
    logBadgeSize: 8,
    logIconSize: 20,
    logSevBadgeSize: 6,
    archLabelSize: 9,
    archSubSize: 6,
    archMaxInputs: 4,
    banDescSize: 6,
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
    selModelTableMaxHeight: 160,
    selLogMaxHeight: 200,
    selSectionGap: 10,
    selLineageTitleSize: 7,
    selLineageTitleColor: "#000000",
    selLineageChevronColor: "#525252",
    nsBanTabFontSize: 0,
  },
};
