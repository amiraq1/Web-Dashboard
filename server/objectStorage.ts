import { Client } from "@replit/object-storage";

let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    _client = new Client();
  }
  return _client;
}

export interface UploadUrlResult {
  uploadURL: string;
  objectPath: string;
}

export async function generateUploadUrl(
  fileName: string,
  isPrivate = true
): Promise<UploadUrlResult> {
  const folder = isPrivate ? ".private" : "public";
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const objectPath = `${folder}/${timestamp}-${safeName}`;

  const uploadURL = await getClient().uploadUrl(objectPath);

  return {
    uploadURL,
    objectPath,
  };
}

export async function deleteObject(objectPath: string): Promise<void> {
  await getClient().delete(objectPath);
}

export async function getDownloadUrl(objectPath: string): Promise<string> {
  return await getClient().downloadUrl(objectPath);
}

export async function getObjectContent(objectPath: string): Promise<Buffer | null> {
  try {
    const result = await getClient().downloadAsBytes(objectPath);
    if (result.ok) {
      return Buffer.from(result.value);
    }
    return null;
  } catch (error) {
    console.error("Error getting object content:", error);
    return null;
  }
}

export async function getObjectText(objectPath: string): Promise<string | null> {
  try {
    const result = await getClient().downloadAsText(objectPath);
    if (result.ok) {
      return result.value;
    }
    return null;
  } catch (error) {
    console.error("Error getting object text:", error);
    return null;
  }
}

export async function listObjects(prefix = ""): Promise<string[]> {
  try {
    const result = await getClient().list(prefix);
    if (result.ok) {
      return result.value.map((obj) => obj.name);
    }
    return [];
  } catch (error) {
    console.error("Error listing objects:", error);
    return [];
  }
}

export function getObjectStorageClient(): Client {
  return getClient();
}
