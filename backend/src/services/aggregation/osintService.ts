import axios from 'axios';
import { logger } from '../../utils/logger';
import { RawArticle, SourceFetchResult } from '../../types';

class OSINTService {
  private alienVaultKey: string;
  private virusTotalKey: string;

  constructor() {
    this.alienVaultKey = process.env.ALIENVAULT_API_KEY || '';
    this.virusTotalKey = process.env.VIRUSTOTAL_API_KEY || '';
  }

  // Fetch threat intelligence from AlienVault OTX
  async fetchAlienVaultPulses(): Promise<SourceFetchResult> {
    try {
      if (!this.alienVaultKey) {
        return {
          source_name: 'AlienVault OTX',
          articles: [],
          success: false,
          error: 'API key not configured',
        };
      }

      const response = await axios.get('https://otx.alienvault.com/api/v1/pulses/subscribed', {
        headers: {
          'X-OTX-API-KEY': this.alienVaultKey,
        },
        params: {
          limit: 50,
          modified_since: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        timeout: 60000,
      });

      const pulses = response.data.results || [];

      const articles: RawArticle[] = pulses.map((pulse: any) => ({
        title: pulse.name,
        content: pulse.description || '',
        url: `https://otx.alienvault.com/pulse/${pulse.id}`,
        image_url: undefined,
        published_at: new Date(pulse.created),
        source_name: 'AlienVault OTX',
        source_type: 'osint',
      }));

      logger.info(`AlienVault OTX: Fetched ${articles.length} threat pulses`);

      return {
        source_name: 'AlienVault OTX',
        articles,
        success: true,
      };
    } catch (error: any) {
      logger.error('AlienVault OTX fetch error:', error.message);
      return {
        source_name: 'AlienVault OTX',
        articles: [],
        success: false,
        error: error.message,
      };
    }
  }

  // Fetch recent threat reports from VirusTotal
  async fetchVirusTotalThreats(): Promise<SourceFetchResult> {
    try {
      if (!this.virusTotalKey) {
        return {
          source_name: 'VirusTotal',
          articles: [],
          success: false,
          error: 'API key not configured',
        };
      }

      // VirusTotal API v3 - fetch recent analyses
      const response = await axios.get('https://www.virustotal.com/api/v3/intelligence/search', {
        headers: {
          'x-apikey': this.virusTotalKey,
        },
        params: {
          query: 'type:threat-actor OR type:campaign',
          limit: 40,
        },
        timeout: 60000,
      });

      const items = response.data.data || [];

      const articles: RawArticle[] = items
        .filter((item: any) => item.attributes)
        .map((item: any) => ({
          title: item.attributes.name || item.attributes.title || 'Threat Report',
          content: item.attributes.description || JSON.stringify(item.attributes),
          url: `https://www.virustotal.com/gui/search/${item.id}`,
          image_url: undefined,
          published_at: item.attributes.last_modification_date
            ? new Date(item.attributes.last_modification_date * 1000)
            : new Date(),
          source_name: 'VirusTotal',
          source_type: 'osint',
        }));

      logger.info(`VirusTotal: Fetched ${articles.length} threat reports`);

      return {
        source_name: 'VirusTotal',
        articles,
        success: true,
      };
    } catch (error: any) {
      logger.error('VirusTotal fetch error:', error.message);
      return {
        source_name: 'VirusTotal',
        articles: [],
        success: false,
        error: error.message,
      };
    }
  }

  // Fetch all OSINT sources
  async fetchAll(): Promise<SourceFetchResult[]> {
    const results = await Promise.all([
      this.fetchAlienVaultPulses(),
      this.fetchVirusTotalThreats(),
    ]);

    return results;
  }
}

export default new OSINTService();
