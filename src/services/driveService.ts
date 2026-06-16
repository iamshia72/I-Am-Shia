// Google Drive backup / sync service
// Implements client-side REST API integration for Google Drive v3 file storage.

export interface DriveBackupData {
  prayerSettings?: any;
  journalEntries?: any[];
  bookmarks?: any[];
  customTasbihs?: any[];
  readingProgress?: any;
  reminders?: any[];
  backupTime?: string;
  deviceInfo?: string;
}

// In-memory cache for the Google Drive OAuth Access Token (secure as per rules)
let inMemoryDriveAccessToken: string | null = null;

export function getCachedDriveToken(): string | null {
  return inMemoryDriveAccessToken;
}

export function setCachedDriveToken(token: string | null) {
  inMemoryDriveAccessToken = token;
}

/**
 * Encures we have a valid non-null Drive access token.
 */
export function hasDriveToken(): boolean {
  return !!inMemoryDriveAccessToken;
}

/**
 * Searches for 'noor_app_backup.json' in the authenticated user's Google Drive.
 * Returns the file ID if found, otherwise null.
 */
export async function searchBackupFile(token: string): Promise<string | null> {
  const query = encodeURIComponent("name = 'noor_app_backup.json' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Drive search error:", errText);
      if (response.status === 401) {
        // Clear expired token
        setCachedDriveToken(null);
      }
      return null;
    }

    const result = await response.json();
    if (result.files && result.files.length > 0) {
      return result.files[0].id;
    }
    return null;
  } catch (error) {
    console.error("Failed to search folder on Google Drive:", error);
    return null;
  }
}

/**
 * Creates 'noor_app_backup.json' file metadata on Google Drive.
 * Returns the created file's ID.
 */
export async function createBackupFile(token: string): Promise<string> {
  const url = 'https://www.googleapis.com/drive/v3/files';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'noor_app_backup.json',
      mimeType: 'application/json'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Google Drive create file error:", errText);
    throw new Error(`Google Drive File Creation failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * Overwrites the actual content of the specified Google Drive backup file.
 */
export async function updateBackupFileContent(token: string, fileId: string, content: DriveBackupData): Promise<void> {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(content)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Google Drive update file content error:", errText);
    throw new Error(`Google Drive File Content Update failed: ${response.statusText}`);
  }
}

/**
 * Downloads the content of 'noor_app_backup.json'.
 */
export async function downloadBackupFileContent(token: string, fileId: string): Promise<DriveBackupData | null> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Drive download content error:", errText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to download file content from Google Drive:", error);
    return null;
  }
}

/**
 * Handles backup of entire state content directly to Google Drive.
 */
export async function backupToGoogleDrive(token: string, data: Omit<DriveBackupData, 'backupTime'>): Promise<void> {
  try {
    let fileId = await searchBackupFile(token);
    if (!fileId) {
      fileId = await createBackupFile(token);
    }
    
    const payload: DriveBackupData = {
      ...data,
      backupTime: new Date().toISOString(),
      deviceInfo: navigator.userAgent.substring(0, 50)
    };
    
    await updateBackupFileContent(token, fileId, payload);
    console.log("Successfully backed up data to Google Drive!");
  } catch (error) {
    console.error("backupToGoogleDrive failed:", error);
    throw error;
  }
}

/**
 * Restores data back directly from Google Drive.
 */
export async function restoreFromGoogleDrive(token: string): Promise<DriveBackupData | null> {
  try {
    const fileId = await searchBackupFile(token);
    if (!fileId) {
      console.log("No backup file found on Google Drive.");
      return null;
    }
    return await downloadBackupFileContent(token, fileId);
  } catch (error) {
    console.error("restoreFromGoogleDrive failed:", error);
    throw error;
  }
}
