export type VisitorAnalyticsTopPage = {
  path: string;
  pageviews: number;
  uniqueVisitors: number;
};

export type VisitorAnalyticsTopReferrer = {
  source: string;
  visits: number;
  uniqueVisitors: number;
};

export type VisitorAnalyticsTopDevice = {
  deviceType: string;
  visits: number;
  uniqueVisitors: number;
};

export type VisitorAnalyticsSummary = {
  todayVisitors: number;
  todayPageviews: number;
  last7DaysVisitors: number;
  last7DaysPageviews: number;
  topPages: VisitorAnalyticsTopPage[];
  topReferrers: VisitorAnalyticsTopReferrer[];
  topDevices: VisitorAnalyticsTopDevice[];
  generatedAt?: string;
  message?: string;
};
