import { google, drive_v3 } from 'googleapis';

/**
 * Response interface for file stream operations
 */
interface StreamResponse {
    data: any;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

/**
 * Configuration interface for Google Drive service
 */
interface GoogleDriveConfig {
    clientEmail: string;
    privateKey: string;
    scopes?: string[];
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

/**
 * Enhanced file interface with additional metadata
 */
export interface DriveFileMetadata extends drive_v3.Schema$File {
    imageUrl?: string;
    downloadUrl?: string;
    viewUrl?: string;
    thumbnailUrl?: string;
}

/**
 * Search options for Drive files
 */
export interface DriveSearchOptions {
    query?: string;
    folderIds?: string[];
    mimeTypes?: string[];
    maxResults?: number;
    orderBy?: string;
    fields?: string;
    includeImages?: boolean;
}

/**
 * Drive API response with metadata
 */
export interface DriveSearchResponse {
    files: DriveFileMetadata[];
    nextPageToken?: string;
    totalFiles: number;
    searchedFolders: string[];
    queries: string[];
}

/**
 * Error classes for better error handling
 */
export class GoogleDriveError extends Error {
    constructor(
        message: string,
        public code: string,
        public status?: number,
        public cause?: Error
    ) {
        super(message);
        this.name = 'GoogleDriveError';
    }
}

export class GoogleDriveAuthError extends GoogleDriveError {
    constructor(message: string, cause?: Error) {
        super(message, 'AUTH_ERROR', 401, cause);
        this.name = 'GoogleDriveAuthError';
    }
}

export class GoogleDriveRateLimitError extends GoogleDriveError {
    constructor(message: string, retryAfter?: number) {
        super(message, 'RATE_LIMIT', 429);
        this.name = 'GoogleDriveRateLimitError';
        this.retryAfter = retryAfter;
    }

    public retryAfter?: number;
}

/**
 * Google Drive client singleton with connection pooling
 */
class GoogleDriveClient {
    private static instance: GoogleDriveClient;
    private driveClient: drive_v3.Drive | null = null;
    private authClient: any | null = null;
    private config: GoogleDriveConfig | null = null;
    private lastAuthTime: number = 0;
    private readonly AUTH_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes

    private constructor() { }

    static getInstance(): GoogleDriveClient {
        if (!GoogleDriveClient.instance) {
            GoogleDriveClient.instance = new GoogleDriveClient();
        }
        return GoogleDriveClient.instance;
    }

    /**
     * Initialize the client with configuration
     */
    async initialize(config: GoogleDriveConfig): Promise<void> {
        try {
            this.config = {
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
                timeout: 30000,
                retryAttempts: 3,
                retryDelay: 1000,
                ...config,
            };

            // Validate configuration
            this.validateConfig(this.config);

            // Create auth client
            this.authClient = new google.auth.JWT({
                email: this.config.clientEmail,
                key: this.config.privateKey.replace(/\\n/g, '\n'),
                scopes: this.config.scopes,
            });

            // Create drive client with optimized settings
            this.driveClient = google.drive({
                version: 'v3',
                auth: this.authClient,
                timeout: this.config.timeout,
                retry: true,
                retryConfig: {
                    retry: this.config.retryAttempts,
                    retryDelay: this.config.retryDelay,
                    statusCodesToRetry: [[100, 199], [429, 429], [500, 599]],
                },
            });

            // Pre-authenticate to validate credentials
            await this.ensureAuthenticated();

            console.log('✅ Google Drive client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Google Drive client:', error);
            throw new GoogleDriveAuthError(
                'Failed to initialize Google Drive client',
                error as Error
            );
        }
    }

    /**
     * Validate the configuration
     */
    private validateConfig(config: GoogleDriveConfig): void {
        if (!config.clientEmail) {
            throw new GoogleDriveAuthError('Client email is required');
        }
        if (!config.privateKey) {
            throw new GoogleDriveAuthError('Private key is required');
        }
        if (!config.clientEmail.includes('@')) {
            throw new GoogleDriveAuthError('Invalid client email format');
        }
        if (!config.privateKey.includes('-----BEGIN')) {
            throw new GoogleDriveAuthError('Invalid private key format');
        }
    }

    /**
     * Ensure the client is authenticated
     */
    private async ensureAuthenticated(): Promise<void> {
        const now = Date.now();

        if (now - this.lastAuthTime > this.AUTH_CACHE_DURATION) {
            try {
                if (!this.authClient) {
                    throw new GoogleDriveAuthError('Auth client not initialized');
                }

                await this.authClient.authorize();
                this.lastAuthTime = now;
                console.log('🔐 Google Drive authentication renewed');
            } catch (error) {
                console.error('❌ Authentication failed:', error);
                throw new GoogleDriveAuthError(
                    'Failed to authenticate with Google Drive',
                    error as Error
                );
            }
        }
    }

    /**
     * Get the Drive client instance
     */
    async getClient(): Promise<drive_v3.Drive> {
        if (!this.driveClient) {
            throw new GoogleDriveError('Drive client not initialized', 'CLIENT_ERROR');
        }

        await this.ensureAuthenticated();
        return this.driveClient;
    }

    /**
     * Handle API errors with proper retry logic
     */
    private async handleApiError(error: any, operation: string): Promise<never> {
        console.error(`❌ Google Drive API error during ${operation}:`, error.message);

        if (error.code === 401 || error.status === 401) {
            throw new GoogleDriveAuthError(`Authentication failed during ${operation}`);
        }

        if (error.code === 429 || error.status === 429) {
            const retryAfter = error.response?.headers?.['retry-after'];
            throw new GoogleDriveRateLimitError(
                `Rate limit exceeded during ${operation}`,
                retryAfter ? parseInt(retryAfter) * 1000 : undefined
            );
        }

        if (error.code === 404 || error.status === 404) {
            throw new GoogleDriveError(
                `Resource not found during ${operation}`,
                'NOT_FOUND',
                404,
                error
            );
        }

        throw new GoogleDriveError(
            `API error during ${operation}: ${error.message}`,
            'API_ERROR',
            error.status || 500,
            error
        );
    }

    /**
     * Execute API call with error handling and retry logic
     */
    async executeApiCall<T>(
        operation: string,
        apiCall: () => Promise<T>
    ): Promise<T> {
        try {
            return await apiCall();
        } catch (error) {
            return await this.handleApiError(error, operation);
        }
    }
}

/**
 * Main composable for Google Drive operations
 */
export const useGoogleDrive = () => {
    const client = GoogleDriveClient.getInstance();

    /**
     * Initialize the Google Drive client
     */
    const initialize = async (): Promise<void> => {
        const config = useRuntimeConfig();

        // Try both runtime config and direct process.env
        let credentials = config.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        // Check if credentials are base64 encoded
        if (credentials && !credentials.startsWith('{')) {
            try {
                credentials = Buffer.from(credentials, 'base64').toString('utf-8');
            } catch (error) {
                console.error('❌ Failed to decode base64 credentials:', error);
            }
        }
        
        if (!credentials) {
            throw new GoogleDriveAuthError(
                'GOOGLE_APPLICATION_CREDENTIALS environment variable is not set'
            );
        }

        let serviceAccount: Record<string, string>;
        try {
            if (credentials.startsWith('./') || credentials.startsWith('/') || credentials.endsWith('.json')) {
                // It's a file path, read the file
                const fs = await import('fs/promises');
                const path = await import('path');

                let credentialsPath = credentials;
                if (credentials.startsWith('./')) {
                    // Resolve relative path from project root
                    credentialsPath = path.resolve(process.cwd(), credentials);
                }

                try {
                    const fileContent = await fs.readFile(credentialsPath, 'utf-8');
                    serviceAccount = JSON.parse(fileContent);
                } catch (fileError) {
                    console.error('❌ Failed to read credentials file:', fileError);
                    throw fileError;
                }
            } else {
                // It's a JSON string
                serviceAccount = JSON.parse(credentials);
            }
        } catch (error) {
            console.error('❌ Credentials parsing failed:', error);
            throw new GoogleDriveAuthError(
                `Invalid Google service account configuration: ${(error as Error).message}`
            );
        }

        if (!serviceAccount.client_email || !serviceAccount.private_key) {
            console.error('❌ Missing required fields in service account');
            throw new GoogleDriveAuthError(
                'Missing client_email or private_key in service account credentials'
            );
        }

        await client.initialize({
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key,
        });
    };

    /**
     * Build search query for Google Drive API
     */
    const buildSearchQuery = (options: DriveSearchOptions): string => {
        const conditions: string[] = [];

        if (options.query) {
            conditions.push(`name contains '${options.query.replace(/'/g, "\\'")}'`);
        }

        if (options.folderIds && options.folderIds.length > 0) {
            const folderConditions = options.folderIds.map(
                (id) => `'${id}' in parents`
            );
            conditions.push(`(${folderConditions.join(' or ')})`);
        }

        if (options.mimeTypes && options.mimeTypes.length > 0) {
            const mimeConditions = options.mimeTypes.map(
                (type) => `mimeType contains '${type}'`
            );
            conditions.push(`(${mimeConditions.join(' or ')})`);
        } else if (options.includeImages !== false) {
            // Default to images only unless explicitly disabled
            conditions.push(`mimeType contains 'image/'`);
        }

        // Exclude trashed files
        conditions.push('trashed=false');

        return conditions.join(' and ');
    };

    /**
     * Enhance files with additional URL properties
     */
    const enhanceFiles = (files: drive_v3.Schema$File[]): DriveFileMetadata[] => {
        return files.map((file) => {
            const enhanced: DriveFileMetadata = { ...file };

            if (file.id) {
                // Use our proxy endpoint for images
                if (file.mimeType?.startsWith('image/')) {
                    enhanced.imageUrl = `/api/v1/drive-image/${file.id}`;
                }

                enhanced.downloadUrl = file.webContentLink || undefined;
                enhanced.viewUrl = file.webViewLink || undefined;
                enhanced.thumbnailUrl = file.thumbnailLink || undefined;
            }

            return enhanced;
        });
    };

    /**
     * Search for files in Google Drive
     */
    const searchFiles = async (
        options: DriveSearchOptions = {}
    ): Promise<DriveSearchResponse> => {
        await initialize();
        const drive = await client.getClient();

        const searchOptions = {
            maxResults: 1000,
            orderBy: 'name',
            fields: 'files(id,name,mimeType,parents,thumbnailLink,webContentLink,webViewLink,size,createdTime,modifiedTime),nextPageToken',
            includeImages: true,
            ...options,
        };

        const query = buildSearchQuery(searchOptions);
        const allFiles: drive_v3.Schema$File[] = [];
        let nextPageToken: string | undefined;

        try {
            do {
                const response = await client.executeApiCall(
                    'searchFiles',
                    async () => {
                        return await drive.files.list({
                            q: query,
                            fields: searchOptions.fields,
                            pageSize: Math.min(searchOptions.maxResults || 1000, 1000),
                            pageToken: nextPageToken,
                            orderBy: searchOptions.orderBy,
                        });
                    }
                );

                const files = response.data.files || [];
                allFiles.push(...files);
                nextPageToken = response.data.nextPageToken || undefined;

                // Respect maxResults limit
                if (searchOptions.maxResults && allFiles.length >= searchOptions.maxResults) {
                    break;
                }
            } while (nextPageToken);

            // Trim to exact maxResults if specified
            const trimmedFiles = searchOptions.maxResults
                ? allFiles.slice(0, searchOptions.maxResults)
                : allFiles;

            // Remove duplicates based on file ID
            const uniqueFiles = trimmedFiles.filter(
                (file, index, self) => index === self.findIndex((f) => f.id === file.id)
            );

            const enhancedFiles = enhanceFiles(uniqueFiles);

            return {
                files: enhancedFiles,
                nextPageToken,
                totalFiles: enhancedFiles.length,
                searchedFolders: options.folderIds || [],
                queries: [query],
            };
        } catch (error) {
            throw error;
        }
    };

    /**
     * Get a specific file by ID
     */
    const getFile = async (
        fileId: string,
        fields?: string
    ): Promise<DriveFileMetadata> => {
        await initialize();
        const drive = await client.getClient();

        try {
            const response = await client.executeApiCall(
                'getFile',
                async () => {
                    return await drive.files.get({
                        fileId,
                        fields: fields || 'id,name,mimeType,parents,thumbnailLink,webContentLink,webViewLink,size,createdTime,modifiedTime',
                    });
                }
            );

            return enhanceFiles([response.data])[0];
        } catch (error) {
            throw error;
        }
    };

    /**
     * Get file content as stream
     */
    const getFileStream = async (fileId: string): Promise<any> => {
        await initialize();
        const drive = await client.getClient();

        try {
            return await client.executeApiCall(
                'getFileStream',
                async () => {
                    return await drive.files.get({
                        fileId,
                        alt: 'media',
                    }, { responseType: 'stream' });
                }
            );
        } catch (error) {
            throw error;
        }
    };

    /**
     * Check if a file is an image
     */
    const isImageFile = (file: DriveFileMetadata): boolean => {
        return !!file.mimeType?.startsWith('image/');
    };

    /**
     * Get folder information
     */
    const getFolder = async (folderId: string): Promise<DriveFileMetadata> => {
        await initialize();
        const drive = await client.getClient();

        try {
            const response = await client.executeApiCall(
                'getFolder',
                async () => {
                    return await drive.files.get({
                        fileId: folderId,
                        fields: 'id,name,mimeType,parents,createdTime,modifiedTime',
                    });
                }
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    return {
        initialize,
        searchFiles,
        getFile,
        getFileStream,
        getFolder,
        isImageFile,
        // Error classes for external use
        GoogleDriveError,
        GoogleDriveAuthError,
        GoogleDriveRateLimitError,
    };
};

export default useGoogleDrive;
