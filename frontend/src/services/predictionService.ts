import { Prediction } from '../types';

class PredictionService {
  /**
   * Returns honest prediction status.
   * AI/ML prediction models will attach here once the ai-service is deployed.
   */
  public getPrediction(locationId: string): Prediction {
    return {
      locationId,
      isAvailable: false,
      message: 'AI crowd trend forecasting model will become active when the ai-service microservice is running.',
    };
  }
}

export const predictionService = new PredictionService();
