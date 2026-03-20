export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
  }[];
}

export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map();

  registerCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.checks.set(name, checkFn);
  }

  async check(): Promise<HealthStatus> {
    const results: HealthStatus['checks'] = [];
    let allPass = true;
    let anyFail = false;

    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const pass = await checkFn();
        results.push({
          name,
          status: pass ? 'pass' : 'fail',
        });
        if (!pass) {
          allPass = false;
          anyFail = true;
        }
      } catch (error) {
        results.push({
          name,
          status: 'fail',
          message: error instanceof Error ? error.message : 'Check failed',
        });
        allPass = false;
        anyFail = true;
      }
    }

    let status: HealthStatus['status'] = 'healthy';
    if (anyFail) {
      status = allPass ? 'degraded' : 'unhealthy';
    }

    return {
      status,
      timestamp: new Date(),
      checks: results,
    };
  }
}

export const healthChecker = new HealthChecker();
