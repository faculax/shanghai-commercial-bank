import { API_BASE_URL } from '../config/api';

export interface ServiceHealth {
  status: 'UP' | 'DOWN';
  responseTime: number;
  timestamp: number;
  error?: string;
  serviceName?: string;
}

export interface ServiceHealthResponse {
  timestamp: number;
  systemHealth: number;
  servicesOnline: number;
  totalServices: number;
  avgResponse: number;
  mainBackend: ServiceHealth;
  gateway: ServiceHealth;
  frontend: ServiceHealth;
  database: ServiceHealth;
  cashFlowService: ServiceHealth;
  positionsService: ServiceHealth;
}

class HealthService {
  async getSystemHealth(): Promise<ServiceHealthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/actuator/health`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch health data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the actuator health response into our ServiceHealthResponse format
      const timestamp = Date.now();
      
      // Create service health objects
      const mainBackend: ServiceHealth = {
        status: data.status === 'UP' ? 'UP' : 'DOWN',
        responseTime: 0, // Will be calculated
        timestamp: timestamp,
        serviceName: 'trading-platform'
      };
      
      const database: ServiceHealth = {
        status: data.components?.db?.status === 'UP' ? 'UP' : 'DOWN',
        responseTime: 0,
        timestamp: timestamp
      };
      
      // Create default health objects for other services
      const gateway: ServiceHealth = {
        status: 'UP',
        responseTime: 0,
        timestamp: timestamp,
        serviceName: 'gateway'
      };
      
      const frontend: ServiceHealth = {
        status: 'UP',
        responseTime: 0,
        timestamp: timestamp
      };
      
      const cashFlowService: ServiceHealth = {
        status: 'UP',
        responseTime: 0,
        timestamp: timestamp
      };
      
      const positionsService: ServiceHealth = {
        status: 'UP',
        responseTime: 0,
        timestamp: timestamp
      };
      
      // Calculate system metrics
      const services = [mainBackend, gateway, frontend, database, cashFlowService, positionsService];
      const servicesOnline = services.filter(s => s.status === 'UP').length;
      const totalServices = services.length;
      const systemHealth = Math.round((servicesOnline / totalServices) * 100);
      const avgResponse = Math.round(
        services.reduce((sum, s) => sum + s.responseTime, 0) / services.length
      );
      
      return {
        timestamp,
        systemHealth,
        servicesOnline,
        totalServices,
        avgResponse,
        mainBackend,
        gateway,
        frontend,
        database,
        cashFlowService,
        positionsService
      };
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }
  
  async checkServiceHealth(serviceUrl: string): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${serviceUrl}/actuator/health`);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          status: 'DOWN',
          responseTime,
          timestamp: Date.now(),
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      
      return {
        status: data.status === 'UP' ? 'UP' : 'DOWN',
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        status: 'DOWN',
        responseTime: Date.now() - startTime,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const healthService = new HealthService();
