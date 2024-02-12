# Google Drive API Integration

This project provides a set of APIs to interact with Google Drive, allowing users to transfer files, list files and folders, create new folders, and check transfer status.

## Setup

1. **Install Required Packages**: Run `npm install` to install all dependencies.

2. **Google Drive API Credentials**: Obtain a service account key JSON file from the Google Cloud Console and save it in the project directory as `google_key.json`.

3. **Environment Variables**: Create a `.env` file in the project directory and define the `PORT` variable if needed.


## API Endpoints

### 1. Transfer File
- **Method**: POST
- **Endpoint**: /transfer
- **Purpose**: Initiates the download and upload process.
- **Request Body**:
- `sourceFileId`: The ID of the file you want to transfer.
- `destinationFolderId`: The ID of the folder where you want to upload the file.
- **Response**: Returns a message indicating the transfer completion or an error message.

### 2. List Files in a Folder
- **Method**: GET
- **Endpoint**: /api/files
- **Purpose**: Retrieves a list of files in a specified folder.
- **Query Parameters**:
- `folderId`: (Optional) The ID of the folder whose files you want to list.
- **Response**: Returns a JSON array containing file objects with their IDs and names.

### 3. Check Transfer Status
- **Method**: GET
- **Endpoint**: /status
- **Purpose**: Checks the status of a transfer operation.
- **Query Parameters**:
- `sourceFileId`: The ID of the source file.
- `destinationFolderId`: The ID of the destination folder.
- **Response**: Returns the status of both the download and upload processes.

### 4. List Folders
- **Method**: GET
- **Endpoint**: /api/folders
- **Purpose**: Retrieves a list of folders from Google Drive.
- **Response**: Returns a JSON array containing folder objects with their IDs and names.

### 5. Create Folder
- **Method**: POST
- **Endpoint**: /api/create-folder
- **Purpose**: Creates a new folder in Google Drive.
- **Request Body**:
- `folderName`: The name of the folder to be created.
- `parentFolderId`: (Optional) The ID of the parent folder where the new folder will be created.
- **Response**: Returns the ID of the newly created folder.

## Usage

1. Start the server: Run `node index.js` in your terminal to start the Express server.

2. Interact with the APIs:
- Use tools like Postman or `curl` commands to send requests to the defined endpoints.
- Example:
  ```
  POST /transfer
  {
    "sourceFileId": "your_source_file_id",
    "destinationFolderId": "your_destination_folder_id"
  }
  ```

## Dependencies

- express
- dotenv
- googleapis
- fs (built-in)

