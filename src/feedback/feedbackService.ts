/**
 * FeedbackService - Service for collecting and logging user feedback on search results
 * 
 * This service handles the collection of user feedback on search result quality,
 * providing valuable data for future AI model tuning and search algorithm improvements.
 */

import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

export interface FeedbackData {
    timestamp: string;
    query: string;
    resultId: string;
    filePath: string;
    feedback: 'positive' | 'negative';
    userId?: string;
    sessionId?: string;
    searchContext?: {
        totalResults: number;
        resultPosition: number;
        searchTime: number;
    };
}

export interface FeedbackStats {
    totalFeedback: number;
    positiveFeedback: number;
    negativeFeedback: number;
    feedbackRate: number;
    averageRating: number;
}

/**
 * Service for managing user feedback on search results
 */
export class FeedbackService {
    private logger: CentralizedLoggingService;
    private feedbackCount: number = 0;

    constructor(logger: CentralizedLoggingService) {
        this.logger = logger;
    }

    /**
     * Logs user feedback for a search result
     * 
     * @param data - Feedback data excluding timestamp (will be added automatically)
     */
    public logFeedback(data: Omit<FeedbackData, 'timestamp'>): void {
        try {
            const feedbackEntry: FeedbackData = {
                ...data,
                timestamp: new Date().toISOString(),
            };

            // Log to the centralized logging service with FEEDBACK prefix
            this.logger.log('FEEDBACK', JSON.stringify(feedbackEntry));
            
            // Increment feedback counter
            this.feedbackCount++;

            // Log summary for monitoring
            this.logger.info(
                `Feedback logged: ${data.feedback} for result ${data.resultId}`,
                {
                    query: data.query,
                    filePath: data.filePath,
                    feedback: data.feedback,
                    totalFeedbackCount: this.feedbackCount
                },
                'FeedbackService'
            );

        } catch (error) {
            this.logger.error(
                'Failed to log feedback',
                {
                    error: error instanceof Error ? error.message : String(error),
                    feedbackData: data
                },
                'FeedbackService'
            );
        }
    }

    /**
     * Logs feedback with additional search context
     * 
     * @param data - Basic feedback data
     * @param searchContext - Additional context about the search session
     */
    public logFeedbackWithContext(
        data: Omit<FeedbackData, 'timestamp' | 'searchContext'>,
        searchContext: FeedbackData['searchContext']
    ): void {
        this.logFeedback({
            ...data,
            searchContext
        });
    }

    /**
     * Gets basic feedback statistics
     * Note: This is a simple implementation. In a production system,
     * you might want to read from a database or log files.
     */
    public getFeedbackStats(): FeedbackStats {
        // This is a simplified implementation
        // In a real system, you'd analyze the log files or database
        return {
            totalFeedback: this.feedbackCount,
            positiveFeedback: 0, // Would be calculated from logs
            negativeFeedback: 0, // Would be calculated from logs
            feedbackRate: 0, // Would be calculated as feedback/searches
            averageRating: 0 // Would be calculated from feedback data
        };
    }

    /**
     * Validates feedback data before logging
     * 
     * @param data - Feedback data to validate
     * @returns true if valid, false otherwise
     */
    private validateFeedbackData(data: Omit<FeedbackData, 'timestamp'>): boolean {
        if (!data.query || typeof data.query !== 'string') {
            this.logger.warn('Invalid feedback: missing or invalid query', {}, 'FeedbackService');
            return false;
        }

        if (!data.resultId || typeof data.resultId !== 'string') {
            this.logger.warn('Invalid feedback: missing or invalid resultId', {}, 'FeedbackService');
            return false;
        }

        if (!data.filePath || typeof data.filePath !== 'string') {
            this.logger.warn('Invalid feedback: missing or invalid filePath', {}, 'FeedbackService');
            return false;
        }

        if (!['positive', 'negative'].includes(data.feedback)) {
            this.logger.warn('Invalid feedback: feedback must be positive or negative', {}, 'FeedbackService');
            return false;
        }

        return true;
    }

    /**
     * Enhanced logging method with validation
     * 
     * @param data - Feedback data to log
     */
    public logValidatedFeedback(data: Omit<FeedbackData, 'timestamp'>): boolean {
        if (!this.validateFeedbackData(data)) {
            return false;
        }

        this.logFeedback(data);
        return true;
    }

    /**
     * Gets the current feedback count
     */
    public getFeedbackCount(): number {
        return this.feedbackCount;
    }

    /**
     * Resets the feedback counter (useful for testing)
     */
    public resetFeedbackCount(): void {
        this.feedbackCount = 0;
    }
}
