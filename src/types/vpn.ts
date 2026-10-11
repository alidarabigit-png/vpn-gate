export interface VpnServer {
  id?: string;
  hostname: string;
  clean_domain: string;
  ip: string;
  score: number;
  ping: number;
  speed: number; // in bps
  country_long: string;
  country_short: string;
  num_vpn_sessions: number;
  uptime: number;
  log_type: string;
  no_log: boolean;
  openvpn_port: number;
  openvpn_protocol: 'TCP' | 'UDP';
  sstp_endpoint: string;
  config_b64?: string;
  testedLatency?: number;
  testedStatus?: 'online' | 'offline' | 'testing' | 'untested';
}

export type PlatformType = 'windows' | 'ios' | 'android' | 'macos' | 'linux';

export type OperatorType =
  | 'mci'
  | 'irancell'
  | 'rightel'
  | 'mokhaberat'
  | 'shatel'
  | 'asiatech'
  | 'zitel'
  | 'wifi';

export interface ClientApp {
  id: string;
  name: string;
  nameFa: string;
  platforms: PlatformType[];
  protocols: string[];
  badge?: string;
  description: string;
  version: string;
  rating: number;
  featured?: boolean;
  links: {
    github?: string;
    direct?: string;
    googlePlay?: string;
    appStore?: string;
    microsoftStore?: string;
  };
}

export interface SetupGuide {
  id: string;
  title: string;
  platform: PlatformType;
  category: 'fast_connect' | 'apps' | 'troubleshooting';
  summary: string;
  steps: {
    stepNumber: number;
    title: string;
    description: string;
    codeSnippet?: string;
    warning?: string;
  }[];
  tips: string[];
}
