/**
 * Notification Service
 * 
 * This service provides a unified interface for showing notifications to users.
 * It supports different notification types, persistence, and integration with
 * VS Code's notification system.
 * 
 * Features:
 * - Multiple notification types (info, warning, error, progress)
 * - Persistent notifications with history
 * - Action buttons and callbacks
 * - Progress notifications for long-running operations
 * - Notification queuing and rate limiting
 * - Integration with centralized logging
 */

import * as vscode from 'vscode';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

/**
 * Notification types
 */
export enum NotificationType {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    SUCCESS = 'success'
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}

/**
 * Interface for notification actions
 */
export interface NotificationAction {
    title: string;
    callback: () => void | Promise<void>;
    isCloseAfterClick?: boolean;
}

/**
 * Interface for notification entries
 */
export interface NotificationEntry {
    id: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    timestamp: Date;
    actions?: NotificationAction[];
    metadata?: Record<string, any>;
    shown: boolean;
    dismissed: boolean;
}

/**
 * Configuration for the notification service
 */
export interface NotificationConfig {
    /** Whether to enable notifications */
    enabled: boolean;
    /** Maximum number of notifications to keep in history */
    maxHistorySize: number;
    /** Whether to show low priority notifications */
    showLowPriority: boolean;
    /** Rate limit for notifications (ms between notifications) */
    rateLimitMs: number;
    /** Whether to persist notifications across sessions */
    persistNotifications: boolean;
}

/**
 * Progress notification interface
 */
export interface ProgressNotification {
    title: string;
    cancellable?: boolean;
    location?: vscode.ProgressLocation;
}

/**
 * Notification service for user feedback
 */
export class NotificationService {
    private config: NotificationConfig;
    private loggingService?: CentralizedLoggingService;
    private notificationHistory: NotificationEntry[] = [];
    private lastNotificationTime: number = 0;
    private notificationQueue: NotificationEntry[] = [];
    private isProcessingQueue: boolean = false;

    constructor(loggingService?: CentralizedLoggingService) {
        this.loggingService = loggingService;
        this.config = this.loadConfig();
        this.loadNotificationHistory();
    }

    /**
     * Load notification configuration
     */
    private loadConfig(): NotificationConfig {
        // Get configuration from VS Code settings
        const config = vscode.workspace.getConfiguration('code-context-engine.notifications');
        
        return {
            enabled: config.get<boolean>('enabled') ?? true,
            maxHistorySize: config.get<number>('maxHistorySize') ?? 100,
            showLowPriority: config.get<boolean>('showLowPriority') ?? false,
            rateLimitMs: config.get<number>('rateLimitMs') ?? 1000,
            persistNotifications: config.get<boolean>('persistNotifications') ?? true
        };
    }

    /**
     * Load notification history from storage
     */
    private loadNotificationHistory(): void {
        if (!this.config.persistNotifications) return;

        try {
            // In a real implementation, this would load from VS Code's global state
            // For now, we'll start with an empty history
            this.notificationHistory = [];
        } catch (error) {
            this.loggingService?.error('Failed to load notification history', {
                error: error instanceof Error ? error.message : String(error)
            }, 'NotificationService');
        }
    }

    /**
     * Save notification history to storage
     */
    private saveNotificationHistory(): void {
        if (!this.config.persistNotifications) return;

        try {
            // In a real implementation, this would save to VS Code's global state
            // For now, we'll just log the action
            this.loggingService?.debug('Notification history saved', { 
                count: this.notificationHistory.length 
            }, 'NotificationService');
        } catch (error) {
            this.loggingService?.error('Failed to save notification history', {
                error: error instanceof Error ? error.message : String(error)
            }, 'NotificationService');
        }
    }

    /**
     * Generate unique notification ID
     */
    private generateNotificationId(): string {
        return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Check if notification should be rate limited
     */
    private isRateLimited(): boolean {
        const now = Date.now();
        return (now - this.lastNotificationTime) < this.config.rateLimitMs;
    }

    /**
     * Add notification to history
     */
    private addToHistory(notification: NotificationEntry): void {
        this.notificationHistory.unshift(notification);
        
        // Limit history size
        if (this.notificationHistory.length > this.config.maxHistorySize) {
            this.notificationHistory = this.notificationHistory.slice(0, this.config.maxHistorySize);
        }
        
        this.saveNotificationHistory();
    }

    /**
     * Process notification queue
     */
    private async processNotificationQueue(): Promise<void> {
        if (this.isProcessingQueue || this.notificationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.notificationQueue.length > 0) {
            if (this.isRateLimited()) {
                // Wait for rate limit to pass
                await new Promise(resolve => setTimeout(resolve, this.config.rateLimitMs));
            }

            const notification = this.notificationQueue.shift();
            if (notification) {
                await this.showNotificationImmediate(notification);
                this.lastNotificationTime = Date.now();
            }
        }

        this.isProcessingQueue = false;
    }

    /**
     * Show notification immediately
     */
    private async showNotificationImmediate(notification: NotificationEntry): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        // Check priority filtering
        if (notification.priority === NotificationPriority.LOW && !this.config.showLowPriority) {
            return;
        }

        try {
            // Create action items for VS Code
            const actions = notification.actions?.map(action => action.title) || [];
            
            let result: string | undefined;

            // Show appropriate notification type
            switch (notification.type) {
                case NotificationType.INFO:
                    result = await vscode.window.showInformationMessage(notification.message, ...actions);
                    break;
                case NotificationType.WARNING:
                    result = await vscode.window.showWarningMessage(notification.message, ...actions);
                    break;
                case NotificationType.ERROR:
                    result = await vscode.window.showErrorMessage(notification.message, ...actions);
                    break;
                case NotificationType.SUCCESS:
                    result = await vscode.window.showInformationMessage(`✓ ${notification.message}`, ...actions);
                    break;
            }

            // Handle action selection
            if (result && notification.actions) {
                const selectedAction = notification.actions.find(action => action.title === result);
                if (selectedAction) {
                    try {
                        await selectedAction.callback();
                        if (selectedAction.isCloseAfterClick) {
                            notification.dismissed = true;
                        }
                    } catch (error) {
                        this.loggingService?.error('Notification action failed', {
                            error: error instanceof Error ? error.message : String(error),
                            notificationId: notification.id,
                            action: selectedAction.title
                        }, 'NotificationService');
                    }
                }
            }

            notification.shown = true;
            this.loggingService?.debug('Notification shown', {
                id: notification.id,
                type: notification.type,
                priority: NotificationPriority[notification.priority]
            }, 'NotificationService');

        } catch (error) {
            this.loggingService?.error('Failed to show notification', {
                error: error instanceof Error ? error.message : String(error),
                notificationId: notification.id
            }, 'NotificationService');
        }
    }

    /**
     * Show a notification
     */
    public async notify(
        type: NotificationType,
        message: string,
        options?: {
            title?: string;
            priority?: NotificationPriority;
            actions?: NotificationAction[];
            metadata?: Record<string, any>;
        }
    ): Promise<string> {
        const notification: NotificationEntry = {
            id: this.generateNotificationId(),
            type,
            priority: options?.priority ?? NotificationPriority.NORMAL,
            title: options?.title ?? '',
            message,
            timestamp: new Date(),
            actions: options?.actions,
            metadata: options?.metadata,
            shown: false,
            dismissed: false
        };

        // Add to history
        this.addToHistory(notification);

        // Add to queue for processing
        this.notificationQueue.push(notification);
        
        // Process queue
        this.processNotificationQueue();

        return notification.id;
    }

    /**
     * Show info notification
     */
    public async info(message: string, actions?: NotificationAction[]): Promise<string> {
        return this.notify(NotificationType.INFO, message, { actions });
    }

    /**
     * Show warning notification
     */
    public async warning(message: string, actions?: NotificationAction[]): Promise<string> {
        return this.notify(NotificationType.WARNING, message, { 
            priority: NotificationPriority.HIGH,
            actions 
        });
    }

    /**
     * Show error notification with automatic "View Logs" action
     */
    public async error(message: string, actions?: NotificationAction[]): Promise<string> {
        // Always add "View Logs" action for error notifications
        const viewLogsAction: NotificationAction = {
            title: 'View Logs',
            callback: () => {
                if (this.loggingService) {
                    this.loggingService.show();
                }
            },
            isCloseAfterClick: false
        };

        // Combine provided actions with the View Logs action
        const allActions = actions ? [...actions, viewLogsAction] : [viewLogsAction];

        return this.notify(NotificationType.ERROR, message, {
            priority: NotificationPriority.CRITICAL,
            actions: allActions
        });
    }

    /**
     * Show success notification
     */
    public async success(message: string, actions?: NotificationAction[]): Promise<string> {
        return this.notify(NotificationType.SUCCESS, message, { actions });
    }

    /**
     * Show progress notification
     */
    public async withProgress<T>(
        options: ProgressNotification,
        task: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Thenable<T>
    ): Promise<T> {
        return vscode.window.withProgress({
            location: options.location ?? vscode.ProgressLocation.Notification,
            title: options.title,
            cancellable: options.cancellable ?? false
        }, task);
    }

    /**
     * Get notification history
     */
    public getHistory(): NotificationEntry[] {
        return [...this.notificationHistory];
    }

    /**
     * Clear notification history
     */
    public clearHistory(): void {
        this.notificationHistory = [];
        this.saveNotificationHistory();
        this.loggingService?.info('Notification history cleared', {}, 'NotificationService');
    }

    /**
     * Get notification by ID
     */
    public getNotification(id: string): NotificationEntry | undefined {
        return this.notificationHistory.find(n => n.id === id);
    }

    /**
     * Dismiss notification
     */
    public dismissNotification(id: string): void {
        const notification = this.getNotification(id);
        if (notification) {
            notification.dismissed = true;
            this.saveNotificationHistory();
        }
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<NotificationConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.loggingService?.debug('Notification configuration updated', { config: this.config }, 'NotificationService');
    }

    /**
     * Get current configuration
     */
    public getConfig(): NotificationConfig {
        return { ...this.config };
    }

    /**
     * Check if notifications are enabled
     */
    public isEnabled(): boolean {
        return this.config.enabled;
    }
}
