

const express = require('express');
require('dotenv').config();
const fs = require('fs');
const { google } = require('googleapis');

const app = express();
app.use(express.json());
const credentials = require('./google_key.json');
// Initialize Google Drive API
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/drive']
);

const drive = google.drive({ version: 'v3', auth });

// Function to download file from Google Drive
async function downloadFile(fileId, filePath, mimeType) {
  const dest = fs.createWriteStream(filePath);
  try {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
      res.data
        .on('end', () => {
          console.log('Download complete');
          resolve();
        })
        .on('error', err => {
          console.error('Error during download:', err);
          reject(err);
        })
        .pipe(dest);
    });
  } catch (error) {
    console.error('Error occurred during download:', error);
    throw error;
  }
}

// Function to upload file to Google Drive in chunks
async function uploadFile(filePath, parentId, mimeType) {
  const fileSize = fs.statSync(filePath).size;
  const fileMetadata = {
    name: 'uploaded_file', // You can change the name as required
    parents: [parentId],
  };
  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };
  const res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });
  console.log('File Uploaded:', res.data.id);
}

async function getFileMimeType(fileId) {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType',
    });
    return response.data.mimeType;
  } catch (error) {
    console.error('Error getting file MIME type:', error.message);
    throw error;
  }
}

// API endpoint to initiate download and upload
app.post('/transfer', async (req, res) => {
  const { sourceFileId, destinationFolderId } = req.body;
  try {
    const mimeType = await getFileMimeType(sourceFileId);
    const timestamp = Date.now();
    const downloadPath = `./downloaded_file_${timestamp}.${mimeType.split('/')[1]}`;
    if (mimeType.startsWith('application/vnd.google-apps')) {
      // It's a Google Docs file, export it
      await downloadFile(sourceFileId, downloadPath, 'application/pdf'); // Export as PDF
    } else {
      // It's not a Google Docs file, download directly
      await downloadFile(sourceFileId, downloadPath, mimeType);
    }
    await uploadFile(downloadPath, destinationFolderId, mimeType);
    res.status(200).json({ message: 'Transfer completed successfully' });
  } catch (error) {
    console.error('Error occurred during transfer:', error);
    res.status(500).json({ error: 'An error occurred during transfer' });
  }
});
// Authentication function
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './google_key.json',
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return await auth.getClient();
}

// Get list of files in a folder
async function listFilesInFolder(folderId) {
  const auth = await authenticate();
  const drive = google.drive({ version: 'v3', auth });

  try {
    const response = await drive.files.list({
      q: folderId ? `'${folderId}' in parents` : undefined,
      fields: 'files(id, name)',
    });
    return response.data.files;
  } catch (error) {
    console.error('Error listing files:', error.message);
    throw error;
  }
}

// API endpoint to get list of files
app.get('/api/files', async (req, res) => {
  const { folderId } = req.query;
  try {
    const files = await listFilesInFolder(folderId);
    res.json(files);
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});
// API endpoint to monitor transfer status
app.get('/status', async (req, res) => {
  const { sourceFileId, destinationFolderId } = req.query;

  try {
    const downloadStatus = await checkDownloadStatus(sourceFileId);
    const uploadStatus = await checkUploadStatus(destinationFolderId);
    res.status(200).json({ downloadStatus, uploadStatus });
  } catch (error) {
    console.error('Error occurred while checking status:', error);
    res.status(500).json({ error: 'An error occurred while checking status' });
  }
});

// Function to check download status
async function checkDownloadStatus(fileId) {
  // Implement logic to check download status
  // For example, you could query the file size and compare it with the downloaded size
  // or check if the file has been completely downloaded
  return 'Download complete'; // Placeholder
}

// Function to check upload status
async function checkUploadStatus(folderId) {
  // Implement logic to check upload status
  // For example, you could query the destination folder and list uploaded files
  // Return appropriate status or progress information
  return 'Upload complete'; // Placeholder
}

// Authenticate with Google Drive API
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './google_key.json', // Path to your service account key file
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return await auth.getClient();
}

// Retrieve list of folders from Google Drive
async function getFolders() {
  const auth = await authenticate();
  const drive = google.drive({ version: 'v3', auth });

  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)',
    });

    return response.data.files;
  } catch (error) {
    console.error('Error retrieving folders:', error);
    throw error;
  }
}

// API endpoint to get list of folders
app.get('/api/folders', async (req, res) => {
  try {
    const folders = await getFolders();
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve folders' });
  }
});

// API endpoint to create a folder
app.post('/api/create-folder', async (req, res) => {
  try {
    const { folderName, parentFolderId } = req.body;

    const auth = new google.auth.GoogleAuth({
      keyFile: './google_key.json',
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : [], // Optional: Set parent folder ID if the folder should be created inside another folder
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });
    // Return the ID of the created folder
    res.json({ folderId: response.data.id });
  } catch (error) {
    console.error('Error creating folder:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

